import './globals.css';
import '../components/ceed/ceed-assistant.css';
import '../components/ceed/ceed.css';
import { CeedAppearance } from '../components/ceed/CeedAppearance';
export const metadata={title:'CEED GYM',icons:{icon:'/ceed-assistant.webp'},description:'Five-day progressive training tracker'};
export default function RootLayout({children}){return <html lang="en" suppressHydrationWarning><body><CeedAppearance />{children}</body></html>}
