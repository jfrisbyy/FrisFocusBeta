import { useState } from "react";
import BoosterRuleConfig, { BoosterRule, defaultBoosterRule } from "../BoosterRuleConfig";

export default function BoosterRuleConfigExample() {
  const [rule, setRule] = useState<BoosterRule>({
    ...defaultBoosterRule,
    enabled: true,
    timesRequired: 4,
    bonusPoints: 20,
  });

  return (
    <div className="max-w-lg">
      <BoosterRuleConfig
        rule={rule}
        onChange={(newRule) => {
          setRule(newRule);
          console.log("Booster rule updated:", newRule);
        }}
        taskName="Read 30 minutes"
      />
    </div>
  );
}
