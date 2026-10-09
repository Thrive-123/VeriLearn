
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateTask from "./pages/CreateTask";
import TaskDetails from "./pages/TaskDetails";
import History from "./pages/History";
import RewardShop from "./pages/RewardShop";
import Revision from "./pages/Revision";
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create-task" element={<CreateTask />} />
                <Route path="/task/:id" element={<TaskDetails />} />
                <Route path="/history" element={<History />} />
                <Route path="/shop" element={<RewardShop />} />
                <Route path="/revision" element={<Revision />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
