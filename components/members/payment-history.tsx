"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Receipt, Info } from "lucide-react"

interface PaymentHistoryProps {
  contributions: any[]
}

export default function PaymentHistory({ contributions }: PaymentHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCount, setShowCount] = useState("10")

  const filteredContributions = contributions
    .filter((c) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        c.cause_code?.toLowerCase().includes(searchLower) || c.reference_number?.toLowerCase().includes(searchLower)
      )
    })
    .slice(0, Number.parseInt(showCount))

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-primary/20">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <Receipt className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Your Payment(s)</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  (Death related only)
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardDescription>
              </div>
            </div>

            <Button className="w-fit bg-primary hover:bg-primary/90">Payment History</Button>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Show</span>
                <Select value={showCount} onValueChange={setShowCount}>
                  <SelectTrigger className="w-20 border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Record..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-primary/20"
                />
              </div>
            </div>

            <div className="rounded-md border border-primary/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Cause</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Goodwill</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContributions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No payment records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContributions.map((contribution) => (
                      <TableRow key={contribution.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>
                              {new Date(contribution.created_at).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(contribution.created_at).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{contribution.cause_code || "N/A"}</span>
                            <span className="text-xs text-muted-foreground">
                              {contribution.reference_number || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          £{Number.parseFloat(contribution.amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          £{Number.parseFloat(contribution.goodwill || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
