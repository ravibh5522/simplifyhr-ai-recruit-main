interface LoadingStateProps {
  loading: boolean;
  hasData: boolean;
  children: React.ReactNode;
}

export const LoadingState = ({ loading, hasData, children }: LoadingStateProps) => {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No data found</p>
      </div>
    );
  }

  return <>{children}</>;
};