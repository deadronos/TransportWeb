import { TopMenuBar } from "./TopMenuBar";
import { ManagementSidebar } from "./ManagementSidebar";
import { BottomInfoDock } from "./BottomInfoDock";
import "./HUD.css";

export function HUD() {
  return (
    <div className="hud-root">
      <TopMenuBar />
      <ManagementSidebar />
      <BottomInfoDock />
    </div>
  );
}
