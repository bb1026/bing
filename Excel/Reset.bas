Attribute VB_Name = "Reset"
Sub ResetWorksheetFormulas()
    Application.ScreenUpdating = False
    Application.DisplayAlerts = False
    On Error Resume Next
    
    Dim wb As Workbook
    Set wb = ThisWorkbook
    
    Dim ws As Worksheet
    Set ws = wb.Sheets("Form")
    
    ws.Protect AllowFiltering:=True
    ws.Unprotect Password:="PKIS"

    Dim Link As String
    Dim FileName As String
    Dim FolderPath As String
    
    FolderPath = Environ("USERPROFILE") & "\Service\Non-instrument service WO\"
       
    FileName = Dir(FolderPath & "Non Instrument work order - *.xlsx")
    If FileName = "" Then
        MsgBox "No Service Orders file found.", vbCritical
        Exit Sub
    End If
    Link = "Shared Documents/Service/Non-instrument service WO/" & "[" & FileName & "]2025"

    With ws
        .Range("B6:F15,H6:L15,B17:F26,H17:L26,B28:F37,H28:L37,B39:E41,G39:G41").ClearContents
    
        .Range("B6,E6,B7,F7,B8,B10,B11,F11,F12").NumberFormat = "General"
        .Range("E6,B9,B12,B13").NumberFormat = "@"
        .Range("F6,F7,B10,F11,F12").Font.Name = "Free 3 of 9 Extended"

        .Range("B6").Formula = "=IF(E6="""","""",UPPER(E6))"
        .Range("F6").Formula = "=TEXTJOIN("""",TRUE,$M$7,B6,$M$7)"
        .Range("B7").Formula = "=IFERROR(VLOOKUP(VALUE(E6),'" & Link & "'!$B:$C,2,0),"""")"
        .Range("F7").Formula = "=TEXTJOIN("""",TRUE,$M$7,B7,$M$7)"
        .Range("B8").Formula = "=IFERROR(VLOOKUP(B7,Zmara!$A:$J,2,0),"""")"
        .Range("B10").Formula = "=TEXTJOIN("""",TRUE,$M$7,B9,$M$7)"
        .Range("B11").Formula = "=IFERROR(VLOOKUP(B7,Inventory1!$A:$E,5,0),"""")"
        .Range("F11").Formula = "=TEXTJOIN("""",TRUE,$M$7,B11,$M$7)"
        .Range("F12").Formula = "=TEXTJOIN("""",TRUE,$M$7,B12,$M$7)"

        Dim destArr As Variant, i As Integer
        destArr = Array("G6", "A17", "G17", "A28", "G28")
        For i = LBound(destArr) To UBound(destArr)
            .Range("A6:F15").Copy Destination:=.Range(destArr(i))
        Next i
    End With
    
    ws.Shapes("Protect").TextFrame2.TextRange.Text = "Unprotect"
    ws.Protect Password:="PKIS", AllowFiltering:=True

    Application.ScreenUpdating = True
    Application.DisplayAlerts = True
End Sub

Sub ResetWorksheetFormulas2()
    Application.ScreenUpdating = False
    Application.DisplayAlerts = False
    
    Dim wb As Workbook
    Dim ws As Worksheet
    Dim isOpen As Boolean
    
    Set wb = ThisWorkbook
    Set ws = wb.Sheets("Form")
    isOpen = False
    
    ws.Protect AllowFiltering:=True
    ws.Unprotect Password:="PKIS"

    Dim Link As String
    Dim FileName As String
    Dim FolderPath As String
    
    FolderPath = Environ("USERPROFILE") & "\PerkinElmer Inc\APAC_OPS_Production - Documents\Service\"
    FileName = Dir(FolderPath & "Service Orders - *.xlsx")
    If FileName = "" Then
        MsgBox "No Service Orders file found.", vbCritical
        Exit Sub
    End If
    
    For Each wb In Application.Workbooks
        Debug.Print "Checking: " & wb.FullName
        If InStr(1, wb.FullName, FileName, vbTextCompare) > 0 Then
            isOpen = True
            Exit For
        End If
    Next wb
    
    If isOpen Then
        MsgBox "The file '" & FileName & "' is already open. Please close it before proceeding.", vbExclamation
        Exit Sub
    End If
    
    Link = "https://perkinelmer.sharepoint.com/teams/APAC_OPS_Production/Shared Documents/Service/" & "[" & FileName & "]"

    With ws
        .Range("B6:F15,H6:L15,B17:F26,H17:L26,B28:F37,H28:L37,B39:E41,G39:G41").ClearContents
    
        .Range("B6,E6,B7,F7,B8,B10,B11,F11,F12").NumberFormat = "General"
        .Range("E6,B9,B12,B13").NumberFormat = "@"
        .Range("F6,F7,B10,F11,F12").Font.Name = "Free 3 of 9 Extended"

        .Range("B6").Formula = "=IF(E6="""","""",E6)"
        .Range("F6").Formula = "=TEXTJOIN("""",TRUE,$M$7,B6,$M$7)"
        
        On Error Resume Next
        ws.Range("B7").Formula = "=IFERROR(VLOOKUP(VALUE(E6),'" & Link & "'!$A:$C,3,0),"""")"
        If Err.Number <> 0 Then
            MsgBox "Worksheet must be selected."
            Call ResetWorksheetFormulas
            GoTo CleanUp
        End If
        On Error GoTo ErrorHandler
        
        .Range("F7").Formula = "=TEXTJOIN("""",TRUE,$M$7,B7,$M$7)"
        .Range("B8").Formula = "=IFERROR(VLOOKUP(B7,Zmara!$A:$J,2,0),"""")"
        .Range("B10").Formula = "=TEXTJOIN("""",TRUE,$M$7,B9,$M$7)"
        .Range("B11").Formula = "=IFERROR(VLOOKUP(B7,Inventory1!$A:$E,5,0),"""")"
        .Range("F11").Formula = "=TEXTJOIN("""",TRUE,$M$7,B11,$M$7)"
        .Range("F12").Formula = "=TEXTJOIN("""",TRUE,$M$7,B12,$M$7)"

        Dim destArr As Variant, i As Integer
        destArr = Array("G6", "A17", "G17", "A28", "G28")
        For i = LBound(destArr) To UBound(destArr)
            .Range("A6:F15").Copy Destination:=.Range(destArr(i))
        Next i
    End With
    
    ws.Shapes("Protect").TextFrame2.TextRange.Text = "Unprotect"
    ws.Protect Password:="PKIS", AllowFiltering:=True
    
CleanUp:
    Application.ScreenUpdating = True
    Application.DisplayAlerts = True
    Exit Sub

ErrorHandler:
    Resume CleanUp
End Sub