import { LayoutShell } from "@/components/layout-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceSummary } from "@/hooks/use-itineraries";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";
import { DollarSign, TrendingUp, Package, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function FinancePage() {
  // Default to current month
  const [currentDate, setCurrentDate] = useState(new Date());
  const startDate = startOfMonth(currentDate).toISOString().split('T')[0];
  const endDate = endOfMonth(currentDate).toISOString().split('T')[0];

  const { data: summary, isLoading } = useFinanceSummary(startDate, endDate);

  // Mock data for the chart if backend returns empty or basic
  const chartData = summary?.days?.map((d: any) => ({
    name: format(new Date(d.date), 'dd'),
    earnings: Number(d.earnings)
  })) || [];

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));

  if (isLoading) {
    return (
      <LayoutShell>
         <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Financial Summary</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>&lt;</Button>
            <span className="font-medium min-w-[100px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
            <Button variant="outline" size="icon" onClick={nextMonth} disabled={currentDate.getMonth() === new Date().getMonth()}>&gt;</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Total Earnings</p>
                  <h3 className="text-3xl font-display font-bold text-green-900 mt-2">
                    R$ {summary?.totalEarnings.toFixed(2) || "0.00"}
                  </h3>
                </div>
                <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center text-green-700">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Deliveries Completed</p>
                  <h3 className="text-3xl font-display font-bold text-foreground mt-2">
                    {summary?.totalDeliveries || 0}
                  </h3>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules Card */}
        <Card className="bg-slate-50 border-slate-200">
           <CardContent className="pt-4 pb-4 flex items-start gap-4">
             <div className="p-2 bg-white rounded-lg border shadow-sm">
               <TrendingUp className="w-5 h-5 text-blue-600" />
             </div>
             <div>
               <h4 className="font-semibold text-sm">Earnings Rules</h4>
               <p className="text-xs text-muted-foreground mt-1">
                 • R$ 2.80 per delivery <br/>
                 • +R$ 100.00 bonus on Sundays (if &gt; 50 deliveries)
               </p>
             </div>
           </CardContent>
        </Card>

        {/* Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Daily Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#888'}} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#888'}}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="earnings" fill="hsl(215 100% 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No data available for this period.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
