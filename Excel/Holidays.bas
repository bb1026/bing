Attribute VB_Name = "Holidays"
Sub Holiday()
    Dim n As Long, m As Long, Holi As Long
    Dim holids As Range, dates As Range
    Dim i As Long, k As Long, p As Long
    
    n = Sheets(1).Range("I1").End(xlDown).Row
    m = Sheets(1).Range("B1").End(xlDown).Row
    Holi = 0
    Set holids = Sheets(1).Range("I1:I" & n)
    
    For p = 1 To n
        Cells(p, "K") = WeekdayName(Weekday(Sheets(1).Cells(p, "I").Value))
    Next
    
    For Each dates In holids
        For i = 1 To m
            If Cells(i, 2).Value = dates.Value Then
                k = dates.Row
                Cells(i, 4).Value = Cells(k, 10).Value
                Sheets(1).Range("I" & k & ":K" & k).Interior.Color = 49407
                Sheets(1).Range("B" & i & ":D" & i).Interior.Color = 49407
                
                If Not (Weekday(Sheets(1).Cells(i, 2).Value) = 7 Or Weekday(Sheets(1).Cells(i, 2).Value) = 1) Then
                    Holi = Holi + 1
                Else
                    Sheets(1).Range("B" & i & ":C" & i).Interior.Color = 65535
                End If
            End If
        Next i
    Next dates
    
    Sheets(1).Cells(1, 7).Value = Holi
End Sub

