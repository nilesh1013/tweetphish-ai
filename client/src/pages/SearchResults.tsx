import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Shield, AlertTriangle, TrendingUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

interface ThreatBadgeProps {
  level: string | null | undefined;
}

function ThreatBadge({ level }: ThreatBadgeProps) {
  const levelStr = level || "unknown";
  const colors = {
    safe: "bg-green-500/20 text-green-400 border-green-500/50",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    critical: "bg-red-500/20 text-red-400 border-red-500/50",
    unknown: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge variant="outline" className={`font-technical ${colors[levelStr as keyof typeof colors] || colors.unknown}`}>
      {levelStr.toUpperCase()}
    </Badge>
  );
}

export default function SearchResults() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/search/:mode/:query");
  
  const mode = params?.mode as "semantic" | "keyword" | "compare" || "semantic";
  const query = decodeURIComponent(params?.query || "");

  const semanticQuery = trpc.tweets.semanticSearch.useQuery(
    { query, limit: 20 },
    { enabled: mode === "semantic" || mode === "compare" }
  );

  const keywordQuery = trpc.tweets.searchByKeyword.useQuery(
    { query },
    { enabled: mode === "keyword" || mode === "compare" }
  );

  const compareQuery = trpc.tweets.compareSearch.useQuery(
    { query },
    { enabled: mode === "compare" }
  );

  const isLoading = mode === "compare" 
    ? compareQuery.isLoading 
    : mode === "semantic" 
      ? semanticQuery.isLoading 
      : keywordQuery.isLoading;

  const semanticResults = mode === "compare" ? compareQuery.data?.semantic : semanticQuery.data;
  const keywordResults = mode === "compare" ? compareQuery.data?.keyword : keywordQuery.data;

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6 font-technical"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          BACK TO SEARCH
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-technical mb-2">ANALYSIS RESULTS</h1>
          <p className="text-muted-foreground">
            Query: <span className="text-primary font-semibold">"{query}"</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Mode: <span className="font-technical text-accent">{mode.toUpperCase()}</span>
          </p>
        </div>

        {mode === "compare" ? (
          <Tabs defaultValue="semantic" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="semantic" className="font-technical">
                🧠 SEMANTIC ({compareQuery.data?.semanticCount || 0})
              </TabsTrigger>
              <TabsTrigger value="keyword" className="font-technical">
                🔍 KEYWORD ({compareQuery.data?.keywordCount || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="semantic" className="space-y-4">
              {isLoading ? (
                <LoadingSkeleton />
              ) : semanticResults && semanticResults.length > 0 ? (
                semanticResults.map((result, idx) => (
                  <ResultCard key={idx} result={result} showSimilarity />
                ))
              ) : (
                <EmptyState message="No semantic results found" />
              )}
            </TabsContent>

            <TabsContent value="keyword" className="space-y-4">
              {isLoading ? (
                <LoadingSkeleton />
              ) : keywordResults && keywordResults.length > 0 ? (
                keywordResults.map((result, idx) => (
                  <ResultCard key={idx} result={result} />
                ))
              ) : (
                <EmptyState message="No keyword results found" />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <LoadingSkeleton />
            ) : mode === "semantic" && semanticResults && semanticResults.length > 0 ? (
              semanticResults.map((result, idx) => (
                <ResultCard key={idx} result={result} showSimilarity />
              ))
            ) : mode === "keyword" && keywordResults && keywordResults.length > 0 ? (
              keywordResults.map((result, idx) => (
                <ResultCard key={idx} result={result} />
              ))
            ) : (
              <EmptyState message="No results found" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result, showSimilarity }: { result: any; showSimilarity?: boolean }) {
  return (
    <Card className="tech-frame bg-card/30 backdrop-blur">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg font-normal mb-2">
              {result.text || "No text available"}
            </CardTitle>
            {result.author && (
              <CardDescription className="font-technical text-xs">
                @{result.authorUsername || result.author}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <ThreatBadge level={result.threatLevel} />
            {result.isPhishing && (
              <Badge variant="destructive" className="font-technical">
                <Shield className="w-3 h-3 mr-1" />
                PHISHING
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSimilarity && result.similarity !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-technical">SIMILARITY SCORE</span>
              <span className="text-primary font-technical">{(result.similarity * 100).toFixed(1)}%</span>
            </div>
            <Progress value={result.similarity * 100} className="h-2" />
          </div>
        )}

        {result.sentimentScore !== undefined && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground font-technical text-xs">SENTIMENT</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-technical">
                  {result.sentimentLabel?.toUpperCase() || "UNKNOWN"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {result.sentimentScore?.toFixed(2) || "N/A"}
                </span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground font-technical text-xs">CREDIBILITY</span>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={(result.credibilityScore || 0) * 100} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground">
                  {((result.credibilityScore || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {result.aiExplanation && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-technical text-accent">AI ANALYSIS:</span> {result.aiExplanation}
            </p>
          </div>
        )}

        {result.detectedPatterns && result.detectedPatterns.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {result.detectedPatterns.map((pattern: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {pattern}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="tech-frame bg-card/30 backdrop-blur">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="tech-frame bg-card/30 backdrop-blur">
      <CardContent className="py-12 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-lg font-technical text-muted-foreground">{message}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try a different search query or mode
        </p>
      </CardContent>
    </Card>
  );
}
