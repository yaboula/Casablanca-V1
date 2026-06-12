import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppStoreProvider } from "@/context/AppStore";
import { Toaster } from "@/components/ui/sonner";

import Home from "@/pages/Home";
import VehicleCatalog from "@/pages/VehicleCatalog";
import VehicleDetail from "@/pages/VehicleDetail";
import BookingFlow from "@/pages/BookingFlow";
import Confirmation from "@/pages/Confirmation";
import CheckIn from "@/pages/CheckIn";
import WaitingRoom from "@/pages/WaitingRoom";
import SmartTicket from "@/pages/SmartTicket";
import CustomerDashboard from "@/pages/CustomerDashboard";
import OperatorDashboard from "@/pages/OperatorDashboard";
import OperatorReview from "@/pages/OperatorReview";
import OperatorHandoff from "@/pages/OperatorHandoff";

function App() {
    return (
        <div className="App">
            <AppStoreProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/catalog" element={<VehicleCatalog />} />
                        <Route path="/vehicle/:id" element={<VehicleDetail />} />
                        <Route path="/booking/:id" element={<BookingFlow />} />
                        <Route path="/confirmation/:ref" element={<Confirmation />} />
                        <Route path="/checkin/:ref" element={<CheckIn />} />
                        <Route path="/waiting/:ref" element={<WaitingRoom />} />
                        <Route path="/ticket/:ref" element={<SmartTicket />} />
                        <Route path="/dashboard" element={<CustomerDashboard />} />
                        <Route path="/operator" element={<OperatorDashboard />} />
                        <Route path="/operator/review/:ref" element={<OperatorReview />} />
                        <Route path="/operator/handoff/:ref" element={<OperatorHandoff />} />
                    </Routes>
                </BrowserRouter>
            </AppStoreProvider>
            <Toaster position="bottom-right" />
        </div>
    );
}

export default App;
