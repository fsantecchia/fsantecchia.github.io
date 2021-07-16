import testFileGenerator from './testFileGenerator';
import './App.css';

function App() {
  const placeholder = `Write your code here
  1 - Export the function/module that you would like to test
  2 - Fill the input below
  3 - Press "Generate file" button

  Example 1: 
  export function isValid(param1: string) {
    let isInvalid = false;
    if (!param1) {
      isInvalid = true;
    }
    return isInvalid;
  }

  Example 2: 
  export const isValid = (param1: string) => {
    let isInvalid = false;
    if (!param1) {
      isInvalid = true;
    }
    return isInvalid;
  }
  `

  const generateUnitTestCases = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const code = (document.getElementById('code') as HTMLInputElement).value;
    const functionName = (document.getElementById('functionName') as HTMLInputElement).value;

    if (code && functionName) {
      const finalCode = testFileGenerator(code, functionName.trim());
      (document.getElementById('generated') as HTMLInputElement).value = finalCode;
    }
  }

  return (
    <div className="App">
      <header>
        JS UNIT TEST FILE GENERATOR BY FARBA
      </header>
      <div>
      <form>
        <textarea name="code" id="code" rows={50} cols={100} placeholder={placeholder} required/>
        <textarea name="generated" id="generated" rows={50} cols={100} value="The test file will be added here" readOnly />
        <br />
        <span>Module name to test -&gt;</span>
        <input placeholder="Module name to test" id="functionName" type="text" required/>
        <button onClick={generateUnitTestCases}>Generate file</button>
      </form>
      </div>
    </div>
  );
}

export default App;
