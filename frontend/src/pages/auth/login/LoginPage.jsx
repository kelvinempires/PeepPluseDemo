import XSvg from "../../../components/svgs/X";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { MdPassword } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FaUser } from "react-icons/fa";
import logo from "/src/logo.png";

const LoginPage = () => {
  const Navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const queryClient = useQueryClient();
  const {
    mutate: loginMutation,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ username, password }) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "something went wrong");
        return data;
      } catch (error) {
        // throw new Error(error);
        toast.error(error.message);
        throw error;
      }
    },
    onSuccess: () => {
      // refetch the user;
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation(formData);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-screen-xl mx-auto flex h-screen">
      <div className="flex-1 hidden lg:flex items-center  justify-center">
        {/* <img src={logo} alt="logo" className="lg:w-2/3 fill-white" /> */}
        <XSvg className="lg:w-2/3 fill-white" />
      </div>
      <div className="flex-1 flex flex-col justify-center items-center">
        <form className="flex gap-4 flex-col" onSubmit={handleSubmit}>
          <img src={logo} alt="logo" className="w-24 lg:hidden fill-white" />
          {/* <XSvg className="w-24 lg:hidden fill-white" /> */}
          <h1 className="text-4xl font-extrabold text-white">{"Let's"} go.</h1>
          <label className="input input-bordered rounded flex items-center gap-2">
            <FaUser />
            <input
              type="text"
              className="grow"
              placeholder="username"
              name="username"
              onChange={handleInputChange}
              value={formData.username}
            />
          </label>

          <label className="input input-bordered rounded flex items-center gap-2">
            <MdPassword />
            <input
              type="password"
              className="grow"
              placeholder="Password"
              name="password"
              onChange={handleInputChange}
              value={formData.password}
            />
          </label>
          <p
            onClick={() => Navigate("/reset-password")}
            className="mb-4 text-indigo-500 cursor-pointer"
          >
            Forgot password?
          </p>
          <button className="btn rounded-full btn-primary text-white">
            {isPending ? "Loading..." : "login"}
          </button>
          {isError && <p className="text-red-500">{error.message}</p>}
        </form>
        {/* <div className="flex flex-col gap-2 mt-4">
          <p className="text-white text-lg">{"Don't"} have an account?</p>
          <Link to="/signup">
            <button className="btn rounded-full btn-primary text-white btn-outline w-full">
              Sign up
            </button>
          </Link>
        </div> */}
        <p className="text-gray-400 text-center mt-4 text-xs">
          Don&apos;t have an account?{" "}
          <span className="text-indigo-400 cursor-pointer underline">
            <Link to="/signup">Sign up</Link>
          </span>
        </p>
      </div>
    </div>
  );
};
export default LoginPage;
