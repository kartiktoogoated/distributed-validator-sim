
const ClientMap = () => {
  return (
    <div className="w-full h-[300px] rounded-md border border-dashed border-muted-foreground flex flex-col items-center justify-center text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-primary mb-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z"
        />
      </svg>
      <h3 className="text-lg font-semibold text-muted-foreground">Global Validator Map</h3>
      <p className="text-sm text-muted-foreground mt-1">Geographic map of active validators will be available soon.</p>
    </div>
  );
};

export default ClientMap;
