$root = "C:\Antigravity\horamed\horamed\src"

function ReplaceInFile($filePath, $oldStr, $newStr) {
    $content = Get-Content $filePath -Raw -Encoding UTF8
    if ($content -match [regex]::Escape($oldStr)) {
        $newContent = $content.Replace($oldStr, $newStr)
        [System.IO.File]::WriteAllText($filePath, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "  FIXED: $($filePath.Replace($root, '')) | '$oldStr' -> '$newStr'"
        return $true
    } else {
        Write-Host "  SKIP (not found): $($filePath.Replace($root, '')) | '$oldStr'"
        return $false
    }
}

Write-Host "=== Corrigindo icones invalidos do @phosphor-icons/react ==="
Write-Host ""

# --- Bot -> Robot as Bot ---
Write-Host ">> Bot -> Robot as Bot"
ReplaceInFile "$root\components\voice\VoiceCommandsSheet.tsx" ", Bot," ", Robot as Bot,"
ReplaceInFile "$root\components\AIChatUI.tsx" "{ Bot," "{ Robot as Bot,"
ReplaceInFile "$root\components\AIResponseCard.tsx" "{ Bot," "{ Robot as Bot,"

# --- CalendarIcon -> CalendarBlank as CalendarIcon ---
Write-Host ">> CalendarIcon -> CalendarBlank as CalendarIcon"
ReplaceInFile "$root\components\VitalsRegistrationModal.tsx" "CalendarIcon," "CalendarBlank as CalendarIcon,"
ReplaceInFile "$root\components\WeightRegistrationModal.tsx" "CalendarIcon }" "CalendarBlank as CalendarIcon }"

# --- CloudOff -> CloudSlash as CloudOff ---
Write-Host ">> CloudOff -> CloudSlash as CloudOff"
ReplaceInFile "$root\components\AlarmManager.tsx" ", CloudOff }" ", CloudSlash as CloudOff }"

# --- Frown -> SmileySad as Frown ---
Write-Host ">> Frown -> SmileySad as Frown"
ReplaceInFile "$root\components\feedback\FeedbackQuest.tsx" ", Frown," ", SmileySad as Frown,"
ReplaceInFile "$root\components\SideEffectQuickLog.tsx" ", Frown," ", SmileySad as Frown,"

# --- Meh -> SmileyMeh as Meh ---
Write-Host ">> Meh -> SmileyMeh as Meh"
ReplaceInFile "$root\components\feedback\FeedbackQuest.tsx" ", Meh," ", SmileyMeh as Meh,"
ReplaceInFile "$root\components\SideEffectQuickLog.tsx" ", Meh," ", SmileyMeh as Meh,"

# --- GripVertical -> DotsSixVertical as GripVertical ---
Write-Host ">> GripVertical -> DotsSixVertical as GripVertical"
ReplaceInFile "$root\components\ui\resizable.tsx" "{ GripVertical }" "{ DotsSixVertical as GripVertical }"

# --- HeartHandshake -> HandHeart as HeartHandshake ---
Write-Host ">> HeartHandshake -> HandHeart as HeartHandshake"
ReplaceInFile "$root\components\BetaTesterUpgrade.tsx" "HeartHandshake," "HandHeart as HeartHandshake,"

# --- PartyPopper -> Confetti as PartyPopper ---
Write-Host ">> PartyPopper -> Confetti as PartyPopper"
ReplaceInFile "$root\components\BetaTesterUpgrade.tsx" ", PartyPopper }" ", Confetti as PartyPopper }"

# --- LineChart -> ChartLine as LineChart ---
Write-Host ">> LineChart -> ChartLine as LineChart"
ReplaceInFile "$root\components\HealthInsightsCard.tsx" ", LineChart }" ", ChartLine as LineChart }"

# --- Navigation -> NavigationArrow as Navigation ---
Write-Host ">> Navigation -> NavigationArrow as Navigation"
ReplaceInFile "$root\components\health\HealthServiceFinder.tsx" ", Navigation }" ", NavigationArrow as Navigation }"
ReplaceInFile "$root\components\voice\VoiceCommandsSheet.tsx" "Navigation," "NavigationArrow as Navigation,"
ReplaceInFile "$root\components\voice\VoiceOnboardingModal.tsx" "Navigation," "NavigationArrow as Navigation,"

# --- PanelLeft -> SidebarSimple as PanelLeft ---
Write-Host ">> PanelLeft -> SidebarSimple as PanelLeft"
ReplaceInFile "$root\components\ui\sidebar.tsx" "{ PanelLeft }" "{ SidebarSimple as PanelLeft }"

# --- LucideIcon -> Icon (type) ---
Write-Host ">> LucideIcon -> Icon"
$lucideFiles = @(
    "$root\components\fitness\SupplementTag.tsx",
    "$root\components\profile\ProfileMenu.tsx",
    "$root\components\ActionBubble.tsx",
    "$root\components\EmptyStateAnimated.tsx"
)
foreach ($f in $lucideFiles) {
    ReplaceInFile $f "LucideIcon" "Icon"
}

Write-Host ""
Write-Host "=== Correcao concluida! ==="
