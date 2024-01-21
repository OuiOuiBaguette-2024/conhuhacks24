import Cog8ToothIcon from "@heroicons/react/24/solid/Cog8ToothIcon";
import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { LinesSettingsContext } from "../layout";
import IconButton from "./IconButton";
import MetroLine from "./MetroLine";

const Sidebar = () => {
  const [showSettings, setSettings] = useState(false);
  let { linesSettings, setLinesSettings } = useContext(LinesSettingsContext);

  return (
    <div className="absolute right-0 top-0 flex flex-col gap-3 p-5 backdrop-blur-xl h-full items-center">
      <IconButton onClick={() => setSettings(!showSettings)}>
        <Cog8ToothIcon width="45px" height="45px" />
      </IconButton>
      {showSettings &&
        createPortal(
          <div className="absolute top-5 right-24 bg-main p-5 rounded-lg shadow-lg flex flex-col gap-2">
            <h2 className="font-bold">Lines</h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={linesSettings.orange}
                onClick={() =>
                  setLinesSettings({
                    ...linesSettings,
                    orange: !linesSettings.orange,
                  })
                }
                className="mr-2"
              />
              <MetroLine color="orange" />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={linesSettings.blue}
                onClick={() =>
                  setLinesSettings({
                    ...linesSettings,
                    blue: !linesSettings.blue,
                  })
                }
                className="mr-2"
              />
              <MetroLine color="blue" />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={linesSettings.green}
                onClick={() =>
                  setLinesSettings({
                    ...linesSettings,
                    green: !linesSettings.green,
                  })
                }
                className="mr-2"
              />
              <MetroLine color="green" />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={linesSettings.yellow}
                onClick={() =>
                  setLinesSettings({
                    ...linesSettings,
                    yellow: !linesSettings.yellow,
                  })
                }
                className="mr-2"
              />
              <MetroLine color="yellow" />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Sidebar;
