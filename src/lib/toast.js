import { toast } from "sonner";

export const notify = {
  success: (message, options) => toast.success(message, options),
  error: (message, options) => toast.error(message, options),
  info: (message, options) => toast(message, options),
  promise: (promise, messages) => toast.promise(promise, messages),
};
