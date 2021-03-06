import { transformSync, Node, NodePath } from '@babel/core';
import { 
  ConditionalExpression,
  ExportDefaultDeclaration, 
  ExportNamedDeclaration, 
  IfStatement,
} from "@babel/types";
// @ts-ignore
import babelPresetTypescript from '@babel/preset-typescript';
import generate from '@babel/generator';
import prettier from 'prettier';
import prettierBabel from 'prettier/parser-babel';
import prettierTypescript from 'prettier/parser-typescript';

const LINE_BREAK = '\n';
const LINE_BREAK_DOUBLE = '\n\n';

const TEMPLATE = ({
  MODULE_NAME,
  TEST_CASES
}: {
  MODULE_NAME: string;
  TEST_CASES: string;
}) => {return `
  /* 
   * File generated by https://fsantecchia.github.io 
   */

  import ${MODULE_NAME} from '../${MODULE_NAME}'

  ${TEST_CASES}
`};

class App {
  isAsync = true;
  modules: { declarationType: string;
    name: string;
    node: Node
    type: string;
    params?: any[];
    isAsync?: boolean;
  }[] = [];
  selectedModuleName = '';
  selectedModuleParams: Node[] = [];
  //@ts-ignore
  testSuite: Describe; // main Describe
  tryCatchCases: It[] = [];
}
let APP = new App();

class LogicalBranchesGenerator {
  constructor(testNode: Node) {
    this._testNode = testNode;
    this.generateBranchesByTestNode(this._testNode, true);
    this.generateDescribe()
    this.generateTestCases();
  } 

  private _logicalBranches: { name: string; isOptional: boolean; }[] = [];
  private _testNode: Node;
  //@ts-ignore
  private _describe: Describe;

  // testNode => path.node.test
  private generateBranchesByTestNode = (testNode: Node, isMainNode: boolean) => {
    if (testNode.type === 'LogicalExpression') {
      if (isMainNode) {
        this._logicalBranches.push({
          isOptional: false,
          name: '`the condition returns true`'
        })
        this._logicalBranches.push({
          isOptional: false,
          name: '`the condition returns false`'
        })
      }

      this.generateBranchesByTestNode(testNode.left, false);
      this.generateBranchesByTestNode(testNode.right, false);
    } else {
      if (isMainNode) {
        this._logicalBranches.push({
          isOptional: false,
          name: '`the condition returns true`'
        })
        this._logicalBranches.push({
          isOptional: false,
          name: '`the condition returns false`'
        })
      } else {
        this._logicalBranches.push({
          isOptional: true,
          name: '`' + generate(testNode).code + ' returns true' + '`'
        })
        this._logicalBranches.push({
          isOptional: true,
          name: '`' + generate(testNode).code + ' returns false' + '`'
        })
      }
    }
  }

  private generateDescribe = () => {
    const condition = '`if(' + generate(this._testNode).code.replace(/'/g, '`').replace(/\n/g, ' ')+ ')`';
    this._describe = new Describe(`Branches generated by ${condition}`);
  }

  private generateTestCases = () => {
    this._logicalBranches.forEach((branch) => {
      const itName = `should work when ${branch.name.replace(/'/g, '`').replace(/\n/g, ' ')}`;

      const it = new It(itName);

      if (branch.isOptional) {
        it.addComment('optional test case');
      }

      it.generateStructure();

      this._describe.addTestCase(it)
    })
  }

  getDescribe = () => {
    return this._describe;
  }
}

class Describe {
  constructor(description: string) {
    this._description = description;
  }

  private _description: string;
  private _describes: Describe[] = [];
  private _testCases: It[] = [];

  addDiscribe = (discribe: Describe) => {
    this._describes.push(discribe);
  }

  addTestCase = (testCase: It) => {
    this._testCases.push(testCase);
  }

  finish = (): string => {
    return `describe('${this._description}', () => {
      beforeEach(async () => {});

      ${this._testCases.map((it) => it.finish()).join(LINE_BREAK_DOUBLE)}

      ${this._describes.map((describe) => describe.finish()).join(LINE_BREAK_DOUBLE)}
    })`
  }
}

class It {
  constructor(description: string) {
    this._description = description;
  }

  private _description: string;
  private _lines: string[] = []
  private _comment: string = '';

  addLine = (line: string) => {
    this._lines.push(line);
  }

  addEmptyLine = () => {
    this._lines.push(LINE_BREAK);
  }

  addComment = (comment: string) => {
    this._comment = `/* ${comment} */ ${LINE_BREAK}`;
  }

  generateStructure = () => {
    this._lines.push(getParamsAssigment());
    this._lines.push(LINE_BREAK);
    this._lines.push(getFunctionCall());
    this._lines.push(LINE_BREAK);
    this._lines.push('/* add expect() here */');
  }

  finish = () => {
    return `${this._comment}it('${this._description}', ${APP.isAsync ? 'async' : ''} () => {
      ${this._lines.join(LINE_BREAK)}
    })`
  }
}

/* returns the param's name */
const getParamNameByNode = (paramNode: Node): string => {
  if (paramNode.type === 'Identifier') {
    return paramNode.name;

  } else if (paramNode.type === 'AssignmentPattern') {
    return getParamNameByNode(paramNode.left);

    // Object as param
  } else if (paramNode.type === 'ObjectPattern') {
    const params: string[] = [];
    paramNode.properties.forEach((innerParamNode) => {
      if (innerParamNode.type === 'ObjectProperty') {
        params.push(getParamNameByNode(innerParamNode.key))
      }
    });
    return `{ ${params.join(', ')} }`;
  }
  
  return '';
}

/* returns param1, param2, param3 */
const getParamsForFunction = (): string => {
  return APP.selectedModuleParams.map((paramNode) => getParamNameByNode(paramNode)).join(', ');
}

/* returns const param1 = 'REPLACE'; const param2 = 'REPLACE'; */
const getParamsAssigment = (): string => {
  const params: string[] = [];

  APP.selectedModuleParams.forEach((paramNode) => {
    // Object as params
    if (paramNode.type === 'ObjectPattern') {
      paramNode.properties.forEach((innerParamNode) => {
        if (innerParamNode.type === 'ObjectProperty') {
          params.push(getParamNameByNode(innerParamNode.key))
        }
      });
  
    } else {
      params.push(getParamNameByNode(paramNode))
    }
  })

  const formattedAssigments = params.map((paramName) => {
    return `const ${paramName} = 'REPLACE';`
  })

  return formattedAssigments.join(LINE_BREAK)
}

/* returns const result = function(param1, param2); */
const getFunctionCall = (): string => {
  return `const result = ${APP.isAsync ? 'await' : ''} ${APP.selectedModuleName}(${getParamsForFunction()});`;
}

const getModules = () => {
  return {
    visitor: {
      ExportNamedDeclaration(path: NodePath<ExportNamedDeclaration>) {
        // @ts-ignore
        if (path.node.declaration.id) {
          APP.modules.push({
            // @ts-ignore
            declarationType: path.node.declaration.id.type,
            // @ts-ignore
            name: path.node.declaration.id.name,
            node: path.node,
            type: path.node.type,
          });
        }
        // @ts-ignore
        if (path.node.declaration.declarations) {
          // VariableDeclaration
          // @ts-ignore
          path.node.declaration.declarations.forEach((declaration) => {
            APP.modules.push({
              declarationType: declaration.id.type,
              name: declaration.id.name,
              node: declaration.init,
              params: declaration.init.params,
              isAsync: declaration.init.async,
              type: path.node.type,
            });
          });
        }
        if (path.node.specifiers && path.node.specifiers.length >= 1) {
          path.node.specifiers.forEach((specifier) => {
            APP.modules.push({
              declarationType: specifier.exported.type,
              // @ts-ignore
              name: specifier.exported.name,
              node: path.node,
              type: path.node.type,
            });
          });
        }
        /*if (path.node.declaration?.type === 'VariableDeclaration') {

        }*/
      },
      ExportDefaultDeclaration(path: NodePath<ExportDefaultDeclaration>) {
        if (path.node.declaration.type === 'Identifier') {
          // TODO: FIX
          return;
        }

        APP.modules.push({
          declarationType: path.node.declaration.type,
          // @ts-ignore
          name: path.node.declaration.id.name,
          node: path.node,
          type: path.node.type,
        });
      }
    }
  }
}

const getNodes = () => {
  return {
    visitor: {
      IfStatement: {
        enter: (path: NodePath<IfStatement>) => {
          const logicalBranchesGenerator = new LogicalBranchesGenerator(path.node.test);
          APP.testSuite.addDiscribe(logicalBranchesGenerator.getDescribe());
        },
      },
      ConditionalExpression: {
        enter: (path: NodePath<ConditionalExpression>) => {
          const logicalBranchesGenerator = new LogicalBranchesGenerator(path.node.test);
          APP.testSuite.addDiscribe(logicalBranchesGenerator.getDescribe());
        },
      },
      TryStatement: {
        enter: () => {
          const itName = `Error handling - should execute catch for try number ${APP.tryCatchCases.length + 1}`;

          const uniTestCase = new It(itName);
          uniTestCase.generateStructure();
          APP.tryCatchCases.push(uniTestCase);
        },
      },
    }
  };
}

const buildTestFile = (sourceCode: string, functionName: string) => {
  APP = new App();

  // Set APP.moduleForPlugin
  transformSync(sourceCode, {
    presets: [babelPresetTypescript],
    plugins: [getModules],
    filename: './temp.ts'
  });

  // Set selected module values
  const selectedModule = APP.modules.find(({ name }) => name === functionName);

  if (!selectedModule) {
    return 'WRONG FUNCTION NAME'
  }

  APP.selectedModuleName = selectedModule.name
  // @ts-ignore
  APP.selectedModuleParams = selectedModule.params || selectedModule.node.declaration.params;
  // @ts-ignore
  APP.isAsync = typeof selectedModule.isAsync === 'boolean' ? selectedModule.isAsync : selectedModule.node.declaration.async;

  // Generate main describe
  APP.testSuite = new Describe(`Module ${APP.selectedModuleName}`)

  // Generate first it()
  const firstIt = new It('should work as expected')
  firstIt.generateStructure();
  APP.testSuite.addTestCase(firstIt);

  // Parse AST to string
  const codeToTransform = generate(selectedModule.node).code

  transformSync(codeToTransform, {
    presets: [babelPresetTypescript],
    plugins: [getNodes],
    filename: './temp.ts'
  });

  // Add try/catch statements at the end
  APP.tryCatchCases.map(APP.testSuite.addTestCase)

  const code = TEMPLATE({ 
    MODULE_NAME: APP.selectedModuleName,
    TEST_CASES: APP.testSuite.finish(),
   })

  const finalCode = prettier.format(code, { singleQuote: true, tabWidth: 2, parser: 'babel', plugins: [prettierBabel, prettierTypescript] })

  return finalCode;
}


export default buildTestFile;