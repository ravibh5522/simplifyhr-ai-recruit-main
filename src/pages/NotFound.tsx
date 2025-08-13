import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Search, ArrowLeft, Bot, FileQuestion } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          {/* Animated 404 */}
          <div className="relative mb-8">
            <div className="text-8xl font-black text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text animate-pulse">
              404
            </div>
            <div className="absolute -top-4 -right-4">
              <FileQuestion className="w-12 h-12 text-blue-500 animate-bounce" />
            </div>
          </div>
          
          {/* Error Message */}
          <div className="space-y-4 mb-10">
            <h1 className="text-3xl font-bold text-gray-900">
              Oops! Page Not Found
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
              The page you're looking for seems to have vanished into the digital void. 
              Don't worry, even the best explorers sometimes take a wrong turn!
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm font-mono text-gray-500">
              <Search className="w-4 h-4 mr-2" />
              {location.pathname}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/">
              <Button size="lg" className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
            
            <Link to="/jobs">
              <Button variant="outline" size="lg" className="h-12 px-8 border-gray-200 hover:border-blue-300 hover:text-blue-600">
                <Search className="w-5 h-5 mr-2" />
                Browse Jobs
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={() => window.history.back()}
              className="h-12 px-8 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Fun element */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <Bot className="w-5 h-5" />
              <span className="text-sm">SimplifyHiring AI suggests checking the URL or trying our search</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
