import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export default function SentimentSummary() {
  const { data, isLoading, error } = trpc.tweets.getSentimentSummary.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <p className="text-red-400">Error loading sentiment summary</p>
      </div>
    );
  }

  const { distribution, topPositiveWords, topNegativeWords } = data;
  const total = Number(distribution.total);
  const positive = Number(distribution.positive);
  const negative = Number(distribution.negative);
  const neutral = Number(distribution.neutral);

  const positivePercent = ((positive / total) * 100).toFixed(1);
  const negativePercent = ((negative / total) * 100).toFixed(1);
  const neutralPercent = ((neutral / total) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold font-['Orbitron'] mb-2">
              SENTIMENT ANALYSIS
            </h1>
            <p className="text-gray-400">
              Comprehensive sentiment breakdown across {total.toLocaleString()} tweets
            </p>
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#0f1f3a] border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-400 font-['Orbitron']">
                POSITIVE
              </CardTitle>
              <CardDescription className="text-gray-400">
                Optimistic and encouraging content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-400 mb-4">
                {positive.toLocaleString()}
              </div>
              <Progress value={Number(positivePercent)} className="h-3 bg-gray-700">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${positivePercent}%` }}
                />
              </Progress>
              <p className="text-sm text-gray-400 mt-2">{positivePercent}% of total</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1f3a] border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 font-['Orbitron']">
                NEGATIVE
              </CardTitle>
              <CardDescription className="text-gray-400">
                Threatening and malicious content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-400 mb-4">
                {negative.toLocaleString()}
              </div>
              <Progress value={Number(negativePercent)} className="h-3 bg-gray-700">
                <div 
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${negativePercent}%` }}
                />
              </Progress>
              <p className="text-sm text-gray-400 mt-2">{negativePercent}% of total</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1f3a] border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-yellow-400 font-['Orbitron']">
                NEUTRAL
              </CardTitle>
              <CardDescription className="text-gray-400">
                Informational and balanced content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-400 mb-4">
                {neutral.toLocaleString()}
              </div>
              <Progress value={Number(neutralPercent)} className="h-3 bg-gray-700">
                <div 
                  className="h-full bg-yellow-500 transition-all"
                  style={{ width: `${neutralPercent}%` }}
                />
              </Progress>
              <p className="text-sm text-gray-400 mt-2">{neutralPercent}% of total</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Words */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positive Words */}
          <Card className="bg-[#0f1f3a] border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-400 font-['Orbitron']">
                TOP POSITIVE WORDS
              </CardTitle>
              <CardDescription className="text-gray-400">
                Most frequent words in positive sentiment tweets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPositiveWords.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                        {index + 1}
                      </div>
                      <span className="text-lg font-medium text-white capitalize">
                        {item.word}
                      </span>
                    </div>
                    <div className="text-green-400 font-bold">
                      {item.count}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Negative Words */}
          <Card className="bg-[#0f1f3a] border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 font-['Orbitron']">
                TOP NEGATIVE WORDS
              </CardTitle>
              <CardDescription className="text-gray-400">
                Most frequent words in negative sentiment tweets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topNegativeWords.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                        {index + 1}
                      </div>
                      <span className="text-lg font-medium text-white capitalize">
                        {item.word}
                      </span>
                    </div>
                    <div className="text-red-400 font-bold">
                      {item.count}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
