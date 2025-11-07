"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

interface FuneralSupportTableProps {
  cases: any[]
}

export function FuneralSupportTable({ cases }: FuneralSupportTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "in_progress":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "approved":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Family Contact</TableHead>
            <TableHead>Date of Death</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Repatriation</TableHead>
            <TableHead>Total Cost</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((supportCase) => (
            <TableRow key={supportCase.id}>
              <TableCell className="font-medium">{supportCase.family_contact_name}</TableCell>
              <TableCell>
                {supportCase.date_of_death ? new Date(supportCase.date_of_death).toLocaleDateString() : "N/A"}
              </TableCell>
              <TableCell>{supportCase.funeral_location || "N/A"}</TableCell>
              <TableCell>
                {supportCase.repatriation_needed ? (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="outline">No</Badge>
                )}
              </TableCell>
              <TableCell className="font-medium">£{supportCase.total_cost?.toFixed(2) || "0.00"}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(supportCase.status)}>{supportCase.status.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
