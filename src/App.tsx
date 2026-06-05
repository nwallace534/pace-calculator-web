import { ThemeProvider } from "./components/ThemeProvider";
import Calculator from "./modules/Calculator";
import Footer from "./modules/Footer";
import Header from "./modules/Header";

function App() {
  return (
    <ThemeProvider>
      <Header />
      <div className="mt-5">
        <Calculator />
      </div>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
