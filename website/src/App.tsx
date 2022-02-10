import { useState } from 'react';
import { Button, Card, Divider, Form, Layout, Image, Input, Space, Typography } from 'antd';

import Editor from "react-simple-code-editor";
// @ts-ignore
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";

//import exampleImage from './example.gif';
import testFileGenerator from './testFileGenerator';
import './App.css';

const { Header, Footer, Content } = Layout;

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

function App() {
  const [form] = Form.useForm();
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(
    `The test file will be added here`
  );

  const generateUnitTestCases = () => {
    const functionName = (document.getElementById('functionName') as HTMLInputElement).value;

    let finalCode = '';
    if (code && functionName) {
      finalCode = testFileGenerator(code, functionName.trim());
    } else {
      finalCode = 'MISSING PARAMETERS'
    }

    setGeneratedCode(finalCode);
  }

  return (
    <div className="App background-color">
      <Layout>

        <Header className="background-color">
          <Typography.Title level={1}>
            Generate unit tests for your code!
          </Typography.Title>
        </Header>

        <Content className="background-color">
          <Form form={form} onFinish={generateUnitTestCases}>

            <div>
              <Space size="middle" align="center">
                <div className="code-editor-container">
                  <Editor
                    value={code}
                    onValueChange={(_code) => setCode(_code)}
                    highlight={(_code) => highlight(_code, languages.js)}
                    padding={10}
                    className="code-editor"
                    placeholder={placeholder}
                  />
                </div>
                <div className="code-editor-container">
                  <Editor
                    value={generatedCode}
                    onValueChange={(_code) => setGeneratedCode(_code)}
                    highlight={(_code) => highlight(_code, languages.js)}
                    padding={10}
                    className="code-editor"
                    placeholder={placeholder}
                    readOnly
                  />
                </div>
              </Space>
            </div>

            <br />

            <Space>
              <Card className="background-color">
                <Space size="middle" align="center" direction="vertical">
                  <Form.Item
                    label="Module to test"
                    name="functionName"
                  /*rules={[{ required: true, message: 'Please input your username!' }]}*/
                  >
                    <Input id="functionName" placeholder="Example: isValid" required />
                  </Form.Item>
                  <Button type="primary" htmlType="submit">Generate file</Button>
                </Space>
              </Card>
            </Space>

          </Form>

          <Divider />

          {/*<Space size="middle" align="center" direction="vertical">
            <Typography.Title level={2}>
              How to use
            </Typography.Title>

            <Image src={exampleImage} width={1280} height={720} />
          </Space>*/}

        </Content>

        <Footer className="background-color">by Fabra 2021</Footer>
      </Layout>
    </div>
  );
}

export default App;
