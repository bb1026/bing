Attribute VB_Name = "Leaves"
Sub Leave()
    Application.ScreenUpdating = False
    Dim Startday As Date, Endday As Date, days As Long
    Dim Saturday As Long, Sunday As Long
    Dim k As Long, i As Long, o As Long
    
    Sheets(1).Range("B:D").Clear
    Sheets(1).Range("I:K").Interior.Color = xlNone
    Sheets(1).Range("G1:G5").ClearContents
    Saturday = 0
    Sunday = 0
    
    If Sheets(1).Cells(1, 1) = "" Or Sheets(1).Cells(2, 1) = "" Then Exit Sub
    
    Startday = Cells(1, 1)
    Endday = Cells(2, 1)
    days = (Endday - Startday) + 1
    Sheets(1).Cells(5, 7).Value = days
    
    Sheets(1).Cells(1, 2) = Startday
    Sheets(1).Cells(1, 3) = WeekdayName(Weekday(Startday))
    k = 1
    
    For i = 2 To days
        Sheets(1).Range("B" & i).Value = Sheets(1).Range("B" & k).Value + 1
        k = k + 1
    Next i
    
    For o = 1 To days
        Sheets(1).Range("C" & o).Value = WeekdayName(Weekday(Sheets(1).Range("B" & o).Value))
        If Weekday(Sheets(1).Range("B" & o).Value) = 7 Or Weekday(Sheets(1).Range("B" & o).Value) = 1 Then
            Sheets(1).Range("B" & o & ":C" & o).Interior.Color = 65535
        End If
        If Weekday(Sheets(1).Range("B" & o).Value) = vbSaturday Then
            Saturday = Saturday + 1
            Sheets(1).Cells(2, 7).Value = Saturday
        End If
        If Weekday(Sheets(1).Range("B" & o).Value) = vbSunday Then
            Sunday = Sunday + 1
            Sheets(1).Cells(3, 7).Value = Sunday
        End If
    Next o
    
    Call Holidays.Holiday
    
    Sheets(1).Cells(4, 7).Value = days - Saturday - Sunday - Sheets(1).Cells(1, 7).Value
    Application.ScreenUpdating = True
End Sub

