import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Brain, Target, BarChart3, Database } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch tweets with pagination
  const { data, isLoading, error } = trpc.tweets.getRecent.useQuery({
    page: currentPage,
    limit: 20,
  });

  const lazyAnalyzeMutation = trpc.tweets.lazyAnalyze.useMutation();
  
  // Fetch analytics stats
  const { data: stats } = trpc.analytics.getStats.useQuery();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/search/semantic/${encodeURIComponent(searchQuery)}`);
    }
  };

  const getThreatColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-green-500/20 text-green-400 border-green-500/50";
    }
  };

  const getThreatIcon = (level: string | null) => {
    const iconClass = "w-3 h-3";
    switch (level?.toLowerCase()) {
      case "critical":
      case "high":
        return <Shield className={iconClass} />;
      default:
        return <Target className={iconClass} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Corner Frames */}
      <div className="fixed top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-blue-500/30 pointer-events-none z-50" />
      <div className="fixed top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-blue-500/30 pointer-events-none z-50" />

      <main>
      {/* GitHub Banner */}
      <div className="bg-blue-950/30 border-b border-blue-900/30 py-3">
        <div className="container mx-auto px-4 flex items-center justify-center gap-4">
          <a
            href="https://github.com/nilesh1013/tweetphish-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span className="font-mono text-sm">View on GitHub</span>
          </a>
          <div className="flex gap-2">
            <a
              href="https://github.com/nilesh1013/tweetphish-ai/stargazers"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-900/30 border border-blue-700/50 rounded hover:bg-blue-900/50 transition-colors text-blue-300 text-sm font-mono flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Star
            </a>
            <a
              href="https://github.com/nilesh1013/tweetphish-ai/fork"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-900/30 border border-blue-700/50 rounded hover:bg-blue-900/50 transition-colors text-blue-300 text-sm font-mono flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Fork
            </a>
          </div>
        </div>
      </div>

      {/* Header Badge */}
      <div className="flex justify-center pt-12">
        <div className="px-6 py-2 border border-blue-500/30 bg-blue-500/5 rounded">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-mono">
            <Shield className="w-4 h-4" />
            <span>ADVANCED THREAT DETECTION SYSTEM</span>
          </div>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center mt-8 mb-12">
        <h1 className="text-7xl font-bold tracking-wider mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          TWEETPHISH AI
        </h1>
        <p className="text-gray-400 text-lg">
          Powered by Gemini AI for semantic analysis, threat prediction, and real-time credibility scoring
        </p>
      </div>

      {/* Search Section */}
      <div className="container max-w-4xl mx-auto px-4 mb-12">
        <Card className="p-8 bg-gray-900/50 border-blue-500/20 backdrop-blur">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by meaning (e.g., 'financial fraud')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-gray-800/50 border-blue-500/30 text-white placeholder:text-gray-500 h-12 text-lg"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-lg"
            >
              <Search className="w-5 h-5 mr-2" />
              SEARCH
            </Button>
          </div>
          <p className="text-sm text-yellow-400/80 mt-4 flex items-start gap-2">
            <span>💡</span>
            <span>Semantic search finds tweets by meaning, not just keywords. Try: "investment scams", "account theft", "fake giveaways"</span>
          </p>
        </Card>
      </div>

      {/* Stats Dashboard */}
      <div className="container max-w-7xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gray-900/30 border-blue-500/20 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-mono">TOTAL DATASET</span>
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-4xl font-bold text-blue-400">{stats?.totalTweets || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Tweets analyzed</div>
          </Card>

          <Card className="p-6 bg-gray-900/30 border-blue-500/20 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-mono">SEARCHES PERFORMED</span>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-4xl font-bold text-gray-300">{stats?.totalSearches || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Query operations</div>
          </Card>

          <Card className="p-6 bg-gray-900/30 border-red-500/20 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-mono">THREATS DETECTED</span>
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-4xl font-bold text-red-400">{stats?.threatsDetected || 0}</div>
            <div className="text-xs text-gray-500 mt-1">High-risk content</div>
          </Card>

          <Card className="p-6 bg-gray-900/30 border-red-500/20 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-mono">PHISHING URLS</span>
              <Target className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-4xl font-bold text-red-400">{stats?.phishingDetected || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Malicious links</div>
          </Card>
        </div>
      </div>

      {/* Dataset Tweets Section */}
      <div className="container max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-mono">ANALYZED TWEETS</h2>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/sentiment")}
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <Brain className="w-4 h-4 mr-2" />
              SENTIMENT ANALYSIS
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/dataset")}
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              <Database className="w-4 h-4 mr-2" />
              VIEW DATASET SUMMARY
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading tweets...</div>
        ) : data?.tweets && data.tweets.length > 0 ? (
          <>
            <div className="space-y-4">
              {data.tweets.map((tweet: any) => (
                <Card
                  key={tweet.id}
                  className="p-6 bg-gray-900/30 border-blue-500/20 backdrop-blur hover:border-blue-500/40 transition-all cursor-pointer"
                  onClick={() => setLocation(`/tweet/${tweet.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm text-gray-400 font-mono">@{tweet.authorUsername}</span>
                        <Badge className={`${getThreatColor(tweet.threatLevel)} border flex items-center gap-1`}>
                          {getThreatIcon(tweet.threatLevel)}
                          {tweet.threatLevel?.toUpperCase() || "SAFE"}
                        </Badge>
                        {tweet.isPhishing && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/50 border flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            PHISHING
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-200 mb-3">{tweet.text}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-400">Sentiment:</span>
                          <span className="text-blue-400">{tweet.sentimentLabel || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-green-400" />
                          <span className="text-gray-400">Credibility:</span>
                          <span className="text-green-400">
                            {tweet.credibilityScore ? `${(tweet.credibilityScore * 100).toFixed(0)}%` : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                Previous
              </Button>
              <span className="text-gray-400 font-mono">Page {currentPage}</span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!data?.hasMore}
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <Card className="p-12 bg-gray-900/30 border-blue-500/20 backdrop-blur text-center">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Tweets Found</h3>
            <p className="text-gray-500 mb-6">Upload a dataset to start analyzing tweets</p>
            <Button
              onClick={() => setLocation("/dataset")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Database className="w-4 h-4 mr-2" />
              UPLOAD DATASET
            </Button>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-blue-900/30 bg-[#0a1628]/95 mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-blue-300/50 text-sm">
            © <a href="https://nileshsharma.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">nileshsharma.com</a> 2026. All rights reserved.
          </p>
        </div>
      </footer>
      </main>
    </div>
  );
}
