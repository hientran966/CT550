import { ElNotification } from "element-plus";

let activeMessage = null;

export const notify = ({
  title = "Thông báo",
  message,
  type = "error",
  duration = 3000,
}) => {
  if (activeMessage) return;

  activeMessage = ElNotification({
    title,
    message,
    type,
    duration,
    onClose: () => {
      activeMessage = null;
    },
  });
};
