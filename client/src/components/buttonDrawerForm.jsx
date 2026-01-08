import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Space, Form } from "antd";

const ButtonDrawerForm = ({
  buttonText,
  drawerTitle,
  submitText = "Guardar",
  onSubmit,
  children,
  buttonType = "primary",
}) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const showDrawer = () => setOpen(true);
  const onClose = () => {
    setOpen(false);
    form.resetFields();
  };

  const handleFinish = async (values) => {
    await onSubmit(values);
    onClose();
  };

  return (
    <>
      <Button
        type={buttonType}
        icon={<PlusOutlined />}
        onClick={showDrawer}
      >
        {buttonText}
      </Button>

      <Drawer
        title={drawerTitle}
        size="large"
        open={open}
        onClose={onClose}
        styles={{ body: { paddingBottom: 80 } }}
        extra={
          <Space>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {submitText}
            </Button>
          </Space>
        }
      >
        <Form
          layout="vertical"
          requiredMark={false}
          form={form}
          onFinish={handleFinish}
        >
          {children}
        </Form>
      </Drawer>
    </>
  );
};

export default ButtonDrawerForm;
