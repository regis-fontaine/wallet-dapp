import { toast } from "react-toastify"


 // Toast
 export const success = (data) => {
    toast.success(data, {});
  }

  export const info = (data, time) => {
    toast.info(data, {
      autoClose: time
    });
  }

  export const danger = (data, time) => {
    toast.error(data, {
      autoClose: time
    });
  }