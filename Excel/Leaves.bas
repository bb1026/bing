Attribute VB_Name = "Leaves"
Sub Leave()
    Application.ScreenUpdating = False
    Dim Startday As Date, Endday As Date, days As Long
    Dim Saturday As Long, Sunday As Long
    Dim k As Long, i As Long, o As Long
    
    Range("B:D").Clear
    Range("I:K").Interior.Color = xlNone
    Range("G1:G5").ClearContents
    Saturday = 0
    Sunday = 0
    
    If Cells(1, 1) = "" Or Cells(2, 1) = "" Then Exit Sub
    
    Startday = Cells(1, 1)
    Endday = Cells(2, 1)
    days = (Endday - Startday) + 1
    Cells(5, 7).Value = days
    
    Cells(1, 2) = Startday
    Cells(1, 3) = WeekdayName(Weekday(Startday))
    k = 1
    
    For i = 2 To days
        Range("B" & i).Value = Range("B" & k).Value + 1
        k = k + 1
    Next i
    
    For o = 1 To days
        Range("C" & o).Value = WeekdayName(Weekday(Range("B" & o).Value))
        If Weekday(Range("B" & o).Value) = 7 Or Weekday(Range("B" & o).Value) = 1 Then
            Range("B" & o & ":C" & o).Interior.Color = 65535
        End If
        If Weekday(Range("B" & o).Value) = vbSaturday Then
            Saturday = Saturday + 1
            Cells(2, 7).Value = Saturday
        End If
        If Weekday(Range("B" & o).Value) = vbSunday Then
            Sunday = Sunday + 1
            Cells(3, 7).Value = Sunday
        End If
    Next o
    
    Call Holidays.Holiday
    
    Cells(4, 7).Value = days - Saturday - Sunday - Cells(1, 7).Value
    Application.ScreenUpdating = True
End Sub

