import { transformSync, Node, NodePath } from '@babel/core';
import {
  ConditionalExpression,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Identifier,
  BlockStatement,
  IfStatement,
  Statement,
  TryStatement,
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

  const generateData = async () => {};

  ${TEST_CASES}
`};

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

  getTestCasesLength = () => {
    return this._testCases.length;
  }

  finish = (): string => {
    if (this._describes.length === 0 && this._testCases.length === 0) {
      return '';
    }

    return `describe('${this._description}', () => {
      ${this._testCases.map((it) => it.finish()).join(LINE_BREAK_DOUBLE)}

      ${this._describes.map((describe) => describe.finish()).join(LINE_BREAK_DOUBLE)}
    })`
  }
}

class App {
  isAsync = true;
  modules: { declarationType: string;
    name: string;
    node: Node
    type: string;
    params: any[];
    isAsync: boolean;
  }[] = [];
  selectedModuleName = '';
  selectedModuleParams: Node[] = [];
  //@ts-ignore
  testSuite: Describe; // main Describe
  branches: Describe[] = [];
  tryCatchDescribe: Describe = new Describe(`error handling`);
}
let APP = new App();

const doesThrowError = (node: BlockStatement | null | undefined): boolean => {
  return Boolean(node && node.body.some((childNode) => childNode.type === 'ThrowStatement'));
}

class LogicalBranchesGenerator {
  constructor(statementNode: IfStatement | ConditionalExpression) {
    this._statementNode = statementNode;
    this._testNode = statementNode.test;
    this.generateBranchesByTestNode(this._testNode, true);
    this.generateDescribe()
    this.generateTestCases();
  }

  private _logicalBranches: { name: string; blockStatement: BlockStatement | null; isOptional: boolean; }[] = [];
  private _statementNode: IfStatement | ConditionalExpression;
  private _testNode: Node;
  //@ts-ignore
  private _describe: Describe;

  // testNode => path.node.test
  private generateBranchesByTestNode = (testNode: Node, isMainNode: boolean) => {
    if (testNode.type === 'LogicalExpression') {
      /*if (isMainNode) {
        this._logicalBranches.push({
          isOptional: false,
          name: '`the condition returns true`'
        })

        if (this._hasAlternate) {
          this._logicalBranches.push({
            isOptional: false,
            name: '`the condition returns false`'
          })
        }
      }*/

      this.generateBranchesByTestNode(testNode.left, false);
      this.generateBranchesByTestNode(testNode.right, false);
    } else {
      if (isMainNode) {
        this._logicalBranches.push({
          isOptional: false,
          name: 'the condition returns `true`',
          blockStatement: this._statementNode.consequent.type === 'BlockStatement' ? this._statementNode.consequent : null,
        })

        if (this._statementNode.alternate) {
          this._logicalBranches.push({
            isOptional: false,
            name: 'the condition returns `false`',
            blockStatement: this._statementNode.alternate.type === 'BlockStatement' ? this._statementNode.alternate : null,
          })
        }

      } else {
        this._logicalBranches.push({
          isOptional: false, //true,
          name: '`' + generate(testNode).code + '` returns true',
          blockStatement: this._statementNode.consequent.type === 'BlockStatement' ? this._statementNode.consequent : null,
        })

        if (this._statementNode.alternate) {
          this._logicalBranches.push({
            isOptional: false, //true,
            name: '`' + generate(testNode).code + '` returns false',
            blockStatement: this._statementNode.alternate.type === 'BlockStatement' ? this._statementNode.alternate : null,
          })
        }
      }
    }
  }

  private generateDescribe = () => {
    const condition = '`if(' + generate(this._testNode).code.replace(/'/g, '"').replace(/\n/g, ' ')+ ')`';
    this._describe = new Describe(`branches generated by ${condition}`);
  }

  private generateTestCases = () => {
    this._logicalBranches.forEach((branch) => {
      const helpText = doesThrowError(branch.blockStatement) ? 'throw error' : 'work';
      const itName = `should ${helpText} when ${branch.name.replace(/'/g, '"').replace(/\n/g, ' ')}`;

      const it = new It(itName);

      if (branch.isOptional) {
        it.addComment('optional test case');
      }

      if (doesThrowError(branch.blockStatement)) {
        it.generateErrorStructure();
      } else {
        it.generateStructure();
      }


      this._describe.addTestCase(it)
    })
  }

  getDescribe = () => {
    return this._describe;
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
    this._lines.push(`const mockData = await generateData();`);
    this._lines.push(LINE_BREAK);
    this._lines.push(getParamsAssigment());
    this._lines.push(getFunctionCall());
    this._lines.push(LINE_BREAK);
    this._lines.push('/* add expect() here */');
  }

  generateErrorStructure = () => {
    this._lines.push(`expect.assertions(1);`);
    this._lines.push(LINE_BREAK);
    this._lines.push(`const mockData = await generateData();`);
    this._lines.push(LINE_BREAK);
    this._lines.push(`try {`);
    this._lines.push(LINE_BREAK);
    this._lines.push(getParamsAssigment());
    this._lines.push(getFunctionCall());
    this._lines.push(`} catch(error) {`);
    this._lines.push(LINE_BREAK);
    this._lines.push('/* add expect() here */');
    this._lines.push(LINE_BREAK);
    this._lines.push(`}`);
  }

  finish = () => {
    return `${this._comment}it('${this._description}', ${APP.isAsync || true ? 'async' : ''} () => {
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

/* returns `const result = function(param1, param2);` */
const getFunctionCall = (): string => {
  return `const result = ${APP.isAsync ? 'await' : ''} ${APP.selectedModuleName}(${getParamsForFunction()});`;
}

/* returns Node related to `export default IDENTIFIER` */
const findRelatedNodeByPath = (path: NodePath<ExportDefaultDeclaration>, identifierName: string): Node | null => {
  const allRelatedNodes = path.container as Node | Node[];
  let relatedNode = null;

  if (Array.isArray(allRelatedNodes)) {
    allRelatedNodes.forEach((node) => {
      // function
      if (node.type === 'FunctionDeclaration' && node.id && node.id.name === identifierName) {
        relatedNode = node;
      }

      // arrow function
      if (node.type === 'VariableDeclaration' && node.declarations) {
        node.declarations.forEach((declaration) => {
          const variableNameNode = declaration.id;
          const declaredVariableNode = declaration.init;

          if (
            declaredVariableNode?.type === 'ArrowFunctionExpression' &&
            variableNameNode.type === 'Identifier' &&
            variableNameNode?.name === identifierName
          ) {
            relatedNode = declaredVariableNode;
          }

        });
      }
    });
  }

  return relatedNode;
};

const getModules = () => {
  return {
    visitor: {
      ExportNamedDeclaration(path: NodePath<ExportNamedDeclaration>) {
        if (!path?.node?.declaration) {
          return ;
        }

        const moduleDeclarationNode = path.node.declaration;

        if (moduleDeclarationNode.type === 'FunctionDeclaration' && moduleDeclarationNode.id) {
          APP.modules.push({
            declarationType: moduleDeclarationNode.id.type,
            isAsync: moduleDeclarationNode.async || false,
            name: moduleDeclarationNode.id.name,
            node: moduleDeclarationNode,
            params: moduleDeclarationNode.params,
            type: moduleDeclarationNode.type,
          });
        }

        if (moduleDeclarationNode.type === 'VariableDeclaration' && moduleDeclarationNode.declarations) {
          moduleDeclarationNode.declarations.forEach((declaration) => {
            const variableNameNode = declaration.id;
            const declaredVariableNode = declaration.init;

            if (variableNameNode.type === 'Identifier' && declaredVariableNode?.type === 'ArrowFunctionExpression') {
              APP.modules.push({
                declarationType: declaredVariableNode.type,
                isAsync: declaredVariableNode.async || false,
                name: variableNameNode.name,
                node: declaredVariableNode,
                params: declaredVariableNode.params,
                type: path.node.type,
              });
            }

          });
        }
      },
      ExportDefaultDeclaration(path: NodePath<ExportDefaultDeclaration>) {
        let moduleDeclarationNode: Node = path.node.declaration;
        let tempModuleName = null;
        if (moduleDeclarationNode.type === 'Identifier') {
          tempModuleName = moduleDeclarationNode.name;
          const relatedNode = findRelatedNodeByPath(path, moduleDeclarationNode.name);

          if (relatedNode) {
            moduleDeclarationNode = relatedNode;
          }
        }

        if (moduleDeclarationNode.type === 'FunctionDeclaration' && moduleDeclarationNode.id) {
          APP.modules.push({
            declarationType: moduleDeclarationNode.id.type,
            isAsync: moduleDeclarationNode.async || false,
            name: tempModuleName || moduleDeclarationNode?.id?.name || 'NAME NOT FOUND',
            node: moduleDeclarationNode,
            params: moduleDeclarationNode.params,
            type: moduleDeclarationNode.type,
          });
        }

        if (moduleDeclarationNode.type === 'ArrowFunctionExpression') {
          APP.modules.push({
            declarationType: moduleDeclarationNode.type,
            isAsync: moduleDeclarationNode.async || false,
            name: tempModuleName || 'unknown',
            node: moduleDeclarationNode,
            params: moduleDeclarationNode.params,
            type: path.node.type,
          });
        }
      }
    }
  }
}

const getNodes = () => {
  return {
    visitor: {
      IfStatement: {
        enter: (path: NodePath<IfStatement>) => {
          //console.log(path)
          const logicalBranchesGenerator = new LogicalBranchesGenerator(path.node);
          APP.branches.push(logicalBranchesGenerator.getDescribe());
        },
      },
      ConditionalExpression: {
        enter: (path: NodePath<ConditionalExpression>) => {
          //console.log(path)
          const logicalBranchesGenerator = new LogicalBranchesGenerator(path.node);
          APP.branches.push(logicalBranchesGenerator.getDescribe());
        },
      },
      TryStatement: {
        enter: (path: NodePath<TryStatement>) => {
          console.log(path);
          const itName = `should execute catch for try number ${APP.tryCatchDescribe.getTestCasesLength() + 1}`;

          const uniTestCase = new It(itName);

          if (doesThrowError(path.node.handler?.body)) {
            uniTestCase.generateErrorStructure();
          } else {
            uniTestCase.generateStructure();
          }

          APP.tryCatchDescribe.addTestCase(uniTestCase);
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
    return 'WRONG FUNCTION/MODULE NAME'
  }

  APP.selectedModuleName = selectedModule.name
  // @ts-ignore
  APP.selectedModuleParams = selectedModule.params || selectedModule.node.declaration.params;
  // @ts-ignore
  APP.isAsync = typeof selectedModule.isAsync === 'boolean' ? selectedModule.isAsync : selectedModule.node.declaration.async;
  // APP.isAsync = true;

  // Generate main describe
  APP.testSuite = new Describe(`module ${APP.selectedModuleName}`)

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

  // Add describes
  APP.branches.map(APP.testSuite.addDiscribe);
  APP.testSuite.addDiscribe(APP.tryCatchDescribe);

  const code = TEMPLATE({
    MODULE_NAME: APP.selectedModuleName,
    TEST_CASES: APP.testSuite.finish(),
   })

  const finalCode = prettier.format(code, { singleQuote: true, tabWidth: 2, parser: 'babel', plugins: [prettierBabel, prettierTypescript] })

  return finalCode;
}


export default buildTestFile;