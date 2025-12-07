import { useState } from "react";
import DatePicker from "../DatePicker";

export default function DatePickerExample() {
  const [date, setDate] = useState(new Date());

  return (
    <DatePicker
      date={date}
      onDateChange={(d) => {
        setDate(d);
        console.log("Date changed to:", d);
      }}
    />
  );
}
