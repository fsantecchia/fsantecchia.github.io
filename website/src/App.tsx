import testFileGenerator from './testFileGenerator';
import './App.css';

function App() {

  const generateUnitTestCases = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const code = (document.getElementById('code') as HTMLInputElement).value;
    const functionName = (document.getElementById('functionName') as HTMLInputElement).value;

    if (code && functionName) {
      const finalCode = testFileGenerator(code, functionName);
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
        <textarea name="code" id="code" rows={50} cols={100} placeholder="Write your code here" required/>
        <textarea name="generated" id="generated" rows={50} cols={100} value="The test file will be added here" readOnly />
        <br />
        <input placeholder="Function's name" id="functionName" required/>
        <button onClick={generateUnitTestCases}>Generate file</button>
      </form>
      </div>
    </div>
  );
}

export default App;
