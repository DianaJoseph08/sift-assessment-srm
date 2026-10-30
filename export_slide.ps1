param(
    [string]$pptxPath = "D:\AI_Resume_Shortlisting\sift-resume-agent\sift-resume-agent\Motherson_CogniHire_Executive_Overview.pptx",
    [string]$pdfPath = "D:\AI_Resume_Shortlisting\sift-resume-agent\sift-resume-agent\Motherson_CogniHire_Executive_Overview.pdf",
    [string]$pngPath = "D:\AI_Resume_Shortlisting\sift-resume-agent\sift-resume-agent\Motherson_CogniHire_Executive_Overview.png"
)

try {
    $ppt = New-Object -ComObject PowerPoint.Application
    $pres = $ppt.Presentations.Open($pptxPath, 2, 0, 0)
    $pres.SaveAs($pdfPath, 32)
    $pres.Slides.Item(1).Export($pngPath, "PNG", 1920, 1080)
    $pres.Close()
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
    Write-Host "SUCCESS: Exported PDF and PNG successfully!"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
} finally {
    if ($pres) { try { $pres.Close() } catch {} }
    if ($ppt) { try { $ppt.Quit() } catch {} }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    Get-Process POWERPNT -ErrorAction SilentlyContinue | Stop-Process -Force
}
