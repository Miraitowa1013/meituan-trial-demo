import { HashRouter } from 'react-router-dom'
import { AppProviders } from './app/AppProviders'
import { AppRouter } from './app/AppRouter'
import { DemoSessionProvider } from './demo/DemoSessionProvider'

export default function App() {
  return (
    <AppProviders>
      <DemoSessionProvider>
        <HashRouter>
          <AppRouter />
        </HashRouter>
      </DemoSessionProvider>
    </AppProviders>
  )
}
