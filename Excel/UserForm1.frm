VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} UserForm1 
   Caption         =   "KeyIn Part number"
   ClientHeight    =   8970
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   21660
   OleObjectBlob   =   "UserForm1.frx":0000
   StartUpPosition =   1  'CenterOwner
End
Attribute VB_Name = "UserForm1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub CommandButton1_Click()
    On Error Resume Next
    Application.ScreenUpdating = False
    Dim ws As Worksheet
    Dim currentRow As Long
    Dim currentCol As Long
    Dim i As Long
    Dim lvItem As listItem
    Dim copies As Long
    Dim component As String
    Dim description As String
    Dim quantity As String
    Dim rev As String
    Dim coo As String
    Dim selectedOnly As Boolean
    Dim comboValue As String
    
    comboValue = Me.ComboBox1.Value

    If Val(TextBox_Copies.Text) < 1 Then
        copies = 1
    Else
        copies = Val(TextBox_Copies.Text)
    End If

    selectedOnly = CheckBox1.Value

    Set ws = ThisWorkbook.Sheets(1)
    ws.Range("A:T").UnMerge
    ws.Range("A:T").Clear
    currentRow = 1
    currentCol = 1

    For i = 1 To ListView1.ListItems.Count
        Set lvItem = ListView1.ListItems(i)

        If (selectedOnly And lvItem.Selected) Or Not selectedOnly Then
            component = lvItem.Text                     ' Component
            description = lvItem.SubItems(1)            ' Object description
            quantity = lvItem.SubItems(2)               ' Component quantity
            rev = lvItem.SubItems(7)                    ' Rev
            coo = lvItem.SubItems(6)                    ' COO

            If component <> comboValue Then
                rev = ""
            End If

            For j = 1 To copies
                With ws
                    .Cells(currentRow, currentCol).Value = "'" & component
                    .Range(.Cells(currentRow, currentCol), .Cells(currentRow, currentCol + 5)).Merge
                    .Range(.Cells(currentRow, currentCol), .Cells(currentRow, currentCol + 5)).HorizontalAlignment = xlCenter
                    .Range(.Cells(currentRow, currentCol), .Cells(currentRow, currentCol + 5)).Font.Size = 18
                    .Rows(currentRow).RowHeight = 28.25

                    If rev = "" Then
                        .Cells(currentRow + 1, currentCol).Value = description
                        .Range(.Cells(currentRow + 1, currentCol), .Cells(currentRow + 1, currentCol + 5)).Merge
                        .Range(.Cells(currentRow + 1, currentCol), .Cells(currentRow + 1, currentCol + 5)).HorizontalAlignment = xlLeft
                        .Range(.Cells(currentRow + 1, currentCol), .Cells(currentRow + 1, currentCol + 5)).Font.Size = 10
                        .Range(.Cells(currentRow + 1, currentCol), .Cells(currentRow + 1, currentCol + 5)).WrapText = True
                        .Rows(currentRow + 1).RowHeight = 22.5
                    Else
                        .Cells(currentRow + 1, currentCol).Value = description
                        .Range(.Cells(currentRow + 1, currentCol), .Cells(currentRow + 1, currentCol + 3)).Merge
                        .Range(.Cells(currentRow + 1, currentCol), .Cells(currentRow + 1, currentCol + 3)).HorizontalAlignment = xlLeft
                        .Range(.Cells(currentRow + 1, currentCol), .Cells(currentRow + 1, currentCol + 3)).Font.Size = 10
                        .Range(.Cells(currentRow + 1, currentCol), .Cells(currentRow + 1, currentCol + 3)).WrapText = True

                        .Cells(currentRow + 1, currentCol + 4).Value = "Rev : " & rev
                        .Range(.Cells(currentRow + 1, currentCol + 4), .Cells(currentRow + 1, currentCol + 5)).Merge
                        .Range(.Cells(currentRow + 1, currentCol + 4), .Cells(currentRow + 1, currentCol + 5)).HorizontalAlignment = xlCenter
                        .Range(.Cells(currentRow + 1, currentCol + 4), .Cells(currentRow + 1, currentCol + 5)).Font.Size = 10
                        .Rows(currentRow + 1).RowHeight = 22.5
                    End If

                    .Cells(currentRow + 2, currentCol).Value = "Qty : " & quantity
                    .Range(.Cells(currentRow + 2, currentCol), .Cells(currentRow + 2, currentCol + 1)).Merge
                    .Range(.Cells(currentRow + 2, currentCol), .Cells(currentRow + 2, currentCol + 1)).HorizontalAlignment = xlCenter
                    .Range(.Cells(currentRow + 2, currentCol), .Cells(currentRow + 2, currentCol + 1)).Font.Size = 10

                    .Cells(currentRow + 2, currentCol + 2).Value = "Made In : " & coo
                    .Range(.Cells(currentRow + 2, currentCol + 2), .Cells(currentRow + 2, currentCol + 5)).Merge
                    .Range(.Cells(currentRow + 2, currentCol + 2), .Cells(currentRow + 2, currentCol + 5)).HorizontalAlignment = xlCenter
                    .Range(.Cells(currentRow + 2, currentCol + 2), .Cells(currentRow + 2, currentCol + 5)).Font.Size = 10
                    .Rows(currentRow + 2).RowHeight = 22.5
                End With

                currentCol = currentCol + 7
                If currentCol > 21 Then
                    currentCol = 1
                    currentRow = currentRow + 3
                End If
            Next j
        End If
    Next i
    
        Dim totalRows As Long
        Dim pageStartRow As Long
        Dim pageEndRow As Long
        Dim printArea As String
        
        totalRows = currentRow - 1
        
        If totalRows Mod 30 <> 0 Then
            totalRows = (totalRows \ 30 + 1) * 30
        End If
        
        For pageRow = 30 To totalRows Step 30
            ws.HPageBreaks.Add Before:=ws.Rows(pageRow + 1)
        Next pageRow
        
        printArea = "$A$1:$T$" & totalRows
        
        ws.PageSetup.printArea = printArea
    
    Unload Me
    Application.ScreenUpdating = True
End Sub

Private Sub CheckBox1_Click()
    If CheckBox1.Value = True Then
        ListView1.MultiSelect = True
    Else
        ListView1.MultiSelect = False
    End If
End Sub
Private Sub ListView1_BeforeLabelEdit(Cancel As Integer)
    Cancel = True
End Sub

Private Sub TextBox_Copies_Change()
    On Error Resume Next
    Dim inputValue As String
    Dim i As Long

    inputValue = Me.TextBox_Copies.Text

    For i = 1 To Len(inputValue)
        If Not IsNumeric(Mid(inputValue, i, 1)) Then
            Me.TextBox_Copies.Text = Left(inputValue, i - 1)
            Exit Sub
        End If
    Next i

    If Val(inputValue) > 99 Then
        Me.TextBox_Copies.Text = "99"
        Exit Sub
    End If

    If inputValue = "" Then
        Me.TextBox_Copies.Text = "1"
    End If
End Sub


Private Sub UserForm_Initialize()
On Error Resume Next
    Dim ws As Worksheet
    Dim sheetName As String
    Dim listItem As listItem
    
    CheckBox1.Value = False
    Me.TextBox_Copies.Text = "1"
    
    Me.ComboBox1.Clear
    Me.ListView1.ListItems.Clear

    For Each ws In ThisWorkbook.Worksheets
        sheetName = ws.Name
        If sheetName <> "Label" And sheetName <> "CoO" Then
            Me.ComboBox1.AddItem sheetName
        End If
    Next ws

    With Me.ListView1
        .View = lvwReport
        .Gridlines = True
        .FullRowSelect = True
        .ColumnHeaders.Clear

        .ColumnHeaders.Add , , "Component", 100
        .ColumnHeaders.Add , , "Object Description", 300
        .ColumnHeaders.Add , , "Component Quantity", 150
        .ColumnHeaders.Add , , "Base Unit of Measure", 150
        .ColumnHeaders.Add , , "Material Group", 100
        .ColumnHeaders.Add , , "Country of Origin", 120
        .ColumnHeaders.Add , , "CoO", 100
        .ColumnHeaders.Add , , "Rev", 40
    End With

    Set ws = ThisWorkbook.Sheets(1)
    Call LoadDataToListView(ws)
End Sub

Private Sub ComboBox1_Change()
On Error Resume Next
    Dim searchTerm As String
    Dim ws As Worksheet
    Dim sheetName As String
    Dim listItem As listItem
    Dim matchFound As Boolean

    searchTerm = Me.ComboBox1.Text
    matchFound = False

    Me.ListView1.ListItems.Clear

    For Each ws In ThisWorkbook.Worksheets
        sheetName = ws.Name

        If sheetName <> "Label" And sheetName <> "CoO" Then
            If StrComp(sheetName, searchTerm, vbTextCompare) = 0 Then
                Call LoadDataToListView(ws)
                matchFound = True
                Exit For
            ElseIf InStr(1, sheetName, searchTerm, vbTextCompare) > 0 Then
                Set listItem = Me.ListView1.ListItems.Add(, , sheetName)
                listItem.SubItems(1) = "Partial match"
                matchFound = True
            End If
        End If
    Next ws

    If Not matchFound Then
        Set listItem = Me.ListView1.ListItems.Add(, , "No matches found")
        listItem.SubItems(1) = ""
    End If
End Sub

Private Sub LoadDataToListView(ws As Worksheet)
On Error Resume Next
    Dim lastRow As Long, lastCol As Long
    Dim data As Variant
    Dim i As Long
    Dim listItem As listItem

    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column

    data = ws.Range(ws.Cells(1, 1), ws.Cells(lastRow, lastCol)).Value

    Me.ListView1.ListItems.Clear

    For i = 2 To UBound(data, 1)
        If Not IsEmpty(data(i, 2)) Then
            Set listItem = Me.ListView1.ListItems.Add(, , CStr(data(i, 1)))

            listItem.SubItems(1) = CStr(data(i, 2))  ' Object Description
            listItem.SubItems(2) = CStr(data(i, 3))  ' Component Quantity
            listItem.SubItems(3) = CStr(data(i, 4))  ' Base Unit of Measure
            listItem.SubItems(4) = CStr(data(i, 5))  ' Material Group
            listItem.SubItems(5) = CStr(data(i, 6))  ' Country of Origin
            listItem.SubItems(6) = CStr(data(i, 7))  ' COO
            listItem.SubItems(7) = CStr(data(i, 8))  ' Rev
        End If
    Next i
End Sub



