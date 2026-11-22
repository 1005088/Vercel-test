import '../styles.css';

export const metadata = {
  title: 'Country Dashboard',
  description: 'An overview of demo country data with an interactive globe.',
};
 
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}