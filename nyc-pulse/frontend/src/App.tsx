import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import { EventsPage } from "./pages/EventsPage";
import { ShowsPage } from "./pages/ShowsPage";
import { ToddlerPage } from "./pages/ToddlerPage";
import { FilmPage } from "./pages/FilmPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-dvh relative">
        <main className="flex-1 page-enter">
          <Routes>
            <Route path="/" element={<EventsPage />} />
            <Route path="/shows" element={<ShowsPage />} />
            <Route path="/toddler" element={<ToddlerPage />} />
            <Route path="/film" element={<FilmPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
