import logo from './logo.svg';
import testFileGenerator from './testFileGenerator';
import './App.css';

function App() {

  const generateUnitTestCases = () => {
    const code = document.getElementById('code').value;
    const functionName = document.getElementById('functionName').value;
    const finalCode = testFileGenerator(code, functionName);

    document.getElementById('generated').value = finalCode;
  }

  return (
    <div className="App">
      <header>
        JS UNIT TEST FILE GENERATOR
      </header>
      <div>
      <textarea name="code" id="code" rows="50" cols="100">Write something here</textarea>
      <textarea name="generated" id="generated" rows="50" cols="100">Write something here</textarea>
      <br />
      <input placeholder="Function's name" id="functionName" /><button onClick={generateUnitTestCases}>Generate file</button>
      </div>
    </div>
  );
}

export default App;
