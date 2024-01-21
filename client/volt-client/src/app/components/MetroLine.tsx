interface IProps {
  color: "orange" | "blue" | "green" | "yellow";
}

const MetroLine: React.FC<IProps> = ({ color }) => {
  const colorMapping = {
    orange: "bg-orange-400",
    blue: "bg-blue-400",
    green: "bg-green-400",
    yellow: "bg-yellow-400",
  };

  return (
    <div className="relative flex">
      <div className={`${colorMapping[color]} w-6 h-2`} />
      <div className="bg-white rounded-full w-2 h-2 absolute translate-x-full" />
    </div>
  );
};

export default MetroLine;
