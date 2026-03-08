import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import AcceptInvite from "@/pages/AcceptInvite";
import MagicAuth from "@/pages/MagicAuth";
import ResetPassword from "@/pages/ResetPassword";
import Index from "@/pages/Index";
import TrackRecordInWords from "@/pages/TrackRecordInWords";
import OperatorsOurOperators from "@/pages/OperatorsOurOperators";
import OperatorsHowWeWorkTogether from "@/pages/OperatorsHowWeWorkTogether";
import OperatorsIncentives from "@/pages/OperatorsIncentives";
import FundModelWalkThrough from "@/pages/FundModelWalkThrough";
import FundModelExitStrategy from "@/pages/FundModelExitStrategy";
import Sourcing from "@/pages/Sourcing";
import CommittedDeals2026 from "@/pages/CommittedDeals2026";
import SourcingCRM from "@/pages/SourcingCRM";
import Legal from "@/pages/Legal";
import LegalFundTerms from "@/pages/LegalFundTerms";
import LegalSubscriptionAgreement from "@/pages/LegalSubscriptionAgreement";
import LegalFundStructureSetup from "@/pages/LegalFundStructureSetup";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminInvitations from "@/pages/AdminInvitations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/magic-auth" element={<MagicAuth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Index />} />
              <Route path="/operators" element={<Navigate to="/operators/our-operators" replace />} />
              <Route path="/operators/our-operators" element={<OperatorsOurOperators />} />
              <Route path="/operators/how-we-work-together" element={<OperatorsHowWeWorkTogether />} />
              <Route path="/operators/operator-incentives" element={<OperatorsIncentives />} />
              <Route path="/fund-model/walk-through" element={<FundModelWalkThrough />} />
              <Route path="/fund-model/exit-strategy-liquidity" element={<FundModelExitStrategy />} />
              <Route path="/sourcing" element={<Sourcing />} />
              <Route path="/sourcing/crm" element={<SourcingCRM />} />
              <Route path="/committed-deals-2026" element={<CommittedDeals2026 />} />
              <Route path="/legals" element={<Legal />} />
              <Route path="/legals/fund-terms" element={<LegalFundTerms />} />
              <Route path="/legals/subscription-agreement" element={<LegalSubscriptionAgreement />} />
              <Route path="/legals/fund-structure-setup" element={<LegalFundStructureSetup />} />
              <Route path="/track-record/in-words" element={<TrackRecordInWords />} />
              <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AdminAnalytics /></ProtectedRoute>} />
              <Route path="/admin/invitations" element={<ProtectedRoute adminOnly><AdminInvitations /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
