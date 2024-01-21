interface IProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const IconButton: React.FC<IProps> = ({ children, onClick }) => (
  <button
    className="bg-main rounded-lg shadow-lg p-2 hover:bg-secondary active:bg-accent transition-colors"
    onClick={onClick}
  >
    {children}
  </button>
);

export default IconButton;
