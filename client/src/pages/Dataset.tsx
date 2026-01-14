import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Twitter, Database, BookOpen } from "lucide-react";

export default function Dataset() {
  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <header className="border-b border-blue-900/30 bg-[#0a1628]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a1628]/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-['Orbitron'] tracking-wider">TWEETPHISH AI</h1>
              <p className="text-sm text-blue-300/70 mt-1">Advanced Threat Detection System</p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="border-blue-500/50 text-blue-300 hover:bg-blue-950/50"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-4">
            <div className="inline-block px-4 py-2 border border-blue-500/30 rounded-lg mb-4">
              <span className="text-blue-400 text-sm font-['Orbitron'] tracking-wider">FOR RESEARCHERS & DEVELOPERS</span>
            </div>
            <h2 className="text-4xl font-bold font-['Orbitron'] tracking-wider">
              Get Tweet Data for Analysis
            </h2>
            <p className="text-blue-300/70 text-lg max-w-2xl mx-auto">
              Learn how to obtain Twitter/X data for sentiment analysis and threat detection research
            </p>
          </div>

          {/* Option 1: X.com App */}
          <Card className="bg-blue-950/20 border-blue-500/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Twitter className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-['Orbitron'] text-white">Option 1: X.com Developer API</CardTitle>
                  <CardDescription className="text-blue-300/70">
                    Get live tweet streams directly from Twitter/X
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-blue-200/80">
                Access real-time tweet data using the official X (Twitter) Developer API. This is the most reliable method for
                obtaining live tweet streams for analysis.
              </p>
              
              <div className="bg-blue-950/40 border border-blue-500/20 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-blue-300 font-['Orbitron']">Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-blue-200/80 text-sm">
                  <li>Sign up for X Developer Account at <a href="https://developer.twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">developer.twitter.com</a></li>
                  <li>Create a new app and generate API credentials</li>
                  <li>Choose your access tier (Basic: $100/month, Pro: $5,000/month)</li>
                  <li>Use the API to search tweets, get user timelines, or stream real-time data</li>
                  <li>Export data in JSON or CSV format for analysis</li>
                </ol>
              </div>

              <Button
                variant="outline"
                className="w-full border-blue-500/50 text-blue-300 hover:bg-blue-950/50"
                onClick={() => window.open('https://developer.twitter.com', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit X Developer Portal
              </Button>
            </CardContent>
          </Card>

          {/* Option 2: Clone GitHub Repo */}
          <Card className="bg-blue-950/20 border-blue-500/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Github className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-['Orbitron'] text-white">Option 2: Clone GitHub Repository</CardTitle>
                  <CardDescription className="text-blue-300/70">
                    Self-host and analyze your own tweet datasets
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-blue-200/80">
                Clone the TweetPhish AI repository and run it locally. Upload your own tweet datasets in JSON or CSV format
                for sentiment analysis and threat detection.
              </p>
              
              <div className="bg-blue-950/40 border border-blue-500/20 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-blue-300 font-['Orbitron']">Quick Start:</h4>
                <div className="bg-black/40 rounded p-3 font-mono text-sm text-blue-300">
                  <code>
                    # Clone the repository<br />
                    git clone https://github.com/nilesh1013/tweetphish-ai.git<br />
                    <br />
                    # Install dependencies<br />
                    cd tweetphish-ai<br />
                    pnpm install<br />
                    <br />
                    # Set up database and run<br />
                    pnpm db:push<br />
                    pnpm dev
                  </code>
                </div>
              </div>

              <div className="bg-blue-950/40 border border-blue-500/20 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-blue-300 font-['Orbitron']">Upload Your Dataset:</h4>
                <p className="text-sm text-blue-200/80">
                  Place your tweet dataset (JSON/CSV) in the project directory and run the import script:
                </p>
                <div className="bg-black/40 rounded p-3 font-mono text-sm text-blue-300">
                  <code>pnpm exec tsx scripts/import-large.mjs</code>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-blue-500/50 text-blue-300 hover:bg-blue-950/50"
                onClick={() => window.open('https://github.com/nilesh1013/tweetphish-ai', '_blank')}
              >
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
              </Button>
            </CardContent>
          </Card>

          {/* Option 3: Public Datasets */}
          <Card className="bg-blue-950/20 border-blue-500/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Database className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-['Orbitron'] text-white">Option 3: Public Datasets</CardTitle>
                  <CardDescription className="text-blue-300/70">
                    Use existing research datasets for analysis
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-blue-200/80">
                Access publicly available Twitter datasets from research repositories and academic sources.
              </p>
              
              <div className="space-y-3">
                <div className="bg-blue-950/40 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-300 mb-2">Kaggle Datasets</h4>
                  <p className="text-sm text-blue-200/70 mb-2">
                    Twitter spam, phishing, and sentiment analysis datasets
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-500/50 text-blue-300 hover:bg-blue-950/50"
                    onClick={() => window.open('https://www.kaggle.com/datasets?search=twitter', '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Browse Kaggle
                  </Button>
                </div>

                <div className="bg-blue-950/40 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-300 mb-2">GitHub Datasets</h4>
                  <p className="text-sm text-blue-200/70 mb-2">
                    Community-contributed tweet collections and research data
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-500/50 text-blue-300 hover:bg-blue-950/50"
                    onClick={() => window.open('https://github.com/search?q=twitter+dataset', '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Search GitHub
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Research Paper Reference */}
          <Card className="bg-blue-950/20 border-blue-500/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-['Orbitron'] text-white">Research Paper</CardTitle>
                  <CardDescription className="text-blue-300/70">
                    Read the original research behind this project
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-blue-200/80">
                This project is based on published research on real-time phishing detection in tweets. Read the full paper
                for methodology and technical details.
              </p>
              
              <Button
                variant="outline"
                className="w-full border-blue-500/50 text-blue-300 hover:bg-blue-950/50"
                onClick={() => window.open('https://airccj.org/CSCP/vol4/csit42520.pdf', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Read Research Paper (PDF)
              </Button>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <div className="text-center pt-8 pb-4 border-t border-blue-500/20">
            <p className="text-blue-300/70 text-sm">
              Questions or need help? Contact me at{' '}
              <a href="mailto:me@nileshsharma.com" className="text-blue-400 hover:underline">
                me@nileshsharma.com
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-900/30 bg-[#0a1628]/95 mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-blue-300/50 text-sm">
            © <a href="https://nileshsharma.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">nileshsharma.com</a> 2026. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
