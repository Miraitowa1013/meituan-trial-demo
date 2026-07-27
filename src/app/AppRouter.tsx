import { Navigate, Route, Routes } from 'react-router-dom'
import { ChannelHomePage } from '../consumer/channel/ChannelHomePage'
import { StoreDetailPage } from '../consumer/store/StoreDetailPage'
import { CheckoutPage } from '../consumer/checkout/CheckoutPage'
import { OrderDetailPage } from '../consumer/orders/OrderDetailPage'
import { OrdersPage } from '../consumer/orders/OrdersPage'
import { VerificationPage } from '../consumer/verification/VerificationPage'
import { EvidenceGrowthPage } from '../consumer/verification/EvidenceGrowthPage'
import { MerchantOverviewPage } from '../merchant/MerchantOverviewPage'
import { MerchantPlanPage } from '../merchant/MerchantPlanPage'
import { MeituanEntryPage } from '../consumer/meituan/MeituanEntryPage'
import { UnderstandingPage } from '../consumer/understanding/UnderstandingPage'
import { RecommendationsPage } from '../consumer/recommendations/RecommendationsPage'
import { MyTrialPage } from '../consumer/profile/MyTrialPage'
import LegacyDemo from '../legacy/LegacyDemo'
import { ConsumerLayout } from './ConsumerLayout'
import { NotFoundPage } from './NotFoundPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/meituan" element={<MeituanEntryPage />} />
      <Route element={<ConsumerLayout />}>
        <Route path="/trial" element={<ChannelHomePage />} />
        <Route path="/trial/understand" element={<UnderstandingPage />} />
        <Route path="/trial/recommendations" element={<RecommendationsPage />} />
        <Route path="/trial/stores/:storeId" element={<StoreDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/wants" element={<Navigate to="/trial" replace />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        <Route path="/orders/:orderId/verify" element={<VerificationPage />} />
        <Route path="/orders/:orderId/evidence-growth" element={<EvidenceGrowthPage />} />
        <Route path="/me" element={<MyTrialPage />} />
      </Route>
      <Route path="/merchant/:storeId" element={<MerchantOverviewPage />} />
      <Route path="/merchant/:storeId/plans" element={<MerchantPlanPage />} />
      <Route path="/legacy/*" element={<LegacyDemo />} />
      <Route path="/" element={<Navigate to="/meituan" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
