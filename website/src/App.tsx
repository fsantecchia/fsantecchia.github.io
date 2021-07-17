import { Button, Card, Col, Divider, Form, Layout, Image, Input, Row, Space, Typography } from 'antd';

import exampleImage from './example.gif';
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

  const generateUnitTestCases = () => {
    const code = (document.getElementById('code') as HTMLInputElement).value;
    const functionName = (document.getElementById('functionName') as HTMLInputElement).value;

    let finalCode = '';
    if (code && functionName) {
      finalCode = testFileGenerator(code, functionName.trim());
    } else {
      finalCode = 'MISSING PARAMETERS'
    }

    //(document.getElementById('generated') as HTMLInputElement).value = finalCode;
    form.setFieldsValue({ generated: finalCode });
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
              <Input.TextArea name="code" id="code" rows={35} cols={100} placeholder={placeholder} required showCount />
              <Form.Item name="generated">
                <Input.TextArea id="generated" rows={35} cols={100} value="The test file will be added here" readOnly showCount />
              </Form.Item>
            </Space>
          </div>

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

          <Space size="middle" align="center" direction="vertical">
            <Typography.Title level={2}>
              How to use
            </Typography.Title>

            <Image src={exampleImage} width={1280} height={720} />
          </Space>

        </Content>

        <Footer className="background-color">by Fabra 2021</Footer>
      </Layout>
    </div>
  );
}

export default App;
