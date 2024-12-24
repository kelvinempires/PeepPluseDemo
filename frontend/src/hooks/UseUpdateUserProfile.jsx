import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const UseUpdateUserProfile = () => {
    const queryClient = useQueryClient();

   const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useMutation({
     mutationFn: async (formData) => {
       try {
         const res = await fetch(`/api/users/update`, {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify(formData),
         });
         const data = await res.json();
         if (!res.ok) {
           throw new Error(data.error || "something went wrong");
         }
       } catch (error) {
         throw new Error(error.message);
       }
     },
     onSuccess: () => {
       toast.success("profile uploaded successfully");
       Promise.all([
         queryClient.invalidateQueries({ queryKey: ["authUser"] }),
         queryClient.invalidateQueries({ queryKey: ["userprofile"] }),
       ]);
     },
     onError: (error) => {
       toast.error(error.message);
     },
   });
   return {updateProfile,isUpdatingProfile}
}
export default UseUpdateUserProfile
