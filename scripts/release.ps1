<#
.SYNOPSIS
    Pubblica una nuova versione di Xerioth: tag su GitHub e deploy su Cloudflare Pages.
.DESCRIPTION
    Lavora in 6 passi e si ferma al primo problema, spiegando cosa fare:
    1. Controlli: sei su main, senza modifiche non committate e allineato a GitHub; dev è già unito; il tag della
       nuova versione è libero; GitHub CLI è collegata. Poi apre il Blocco note per le note di rilascio.
    2. Versione: aumenta version in package.json e package-lock.json.
    3. Test e build: lancia gli unit test e la build di produzione (che controlla anche i tipi).
    4. Commit, tag e push: dopo la tua conferma crea il commit di release e il tag, e li pubblica su GitHub insieme.
       Cloudflare Pages vede il push su main e pubblica il sito da solo.
    5. Release su GitHub: la crea con titolo e note.
    6. Allineamento: porta dev allo stesso commit di main.

    Se qualcosa fallisce prima della conferma, o rispondi no, rimette tutto com'era: nessun commit, tag o push.

    Le note di rilascio sono per i giocatori: cosa cambia per loro, in italiano semplice, con i trattini. Niente
    dettagli di sviluppo (script, test, refactoring, nomi di file).

    Serve: Node.js con le dipendenze installate (npm install) e GitHub CLI collegata con permesso di push
    (gh auth login). Senza GitHub CLI la release su GitHub va creata a mano.

.NOTES
    1. Porta in main le modifiche da pubblicare: git checkout main, poi git merge dev.
    2. Lancia .\scripts\release.cmd patch (o minor, o major).
    3. Dopo i controlli si apre il Blocco note: scrivi le note di rilascio, salva, chiudi il Blocco note e premi
       Invio nel terminale.
    4. Aspetta test e build. Quando chiede "Procedere con ...? [s/N]", controlla il riepilogo, scrivi s e premi Invio.
    5. Alla fine compare FATTO con la versione pubblicata. Per continuare a lavorare torna su dev: git checkout dev.

.PARAMETER Bump
    Tipo di versione.
    major: cambiamenti importanti (1.2.3 diventa 2.0.0).
    minor: novità (1.2.3 diventa 1.3.0).
    patch: solo correzioni (1.2.3 diventa 1.2.4).

.PARAMETER Yes
    Non chiede conferme (con -Yes un dev non ancora unito a main interrompe la release).

.EXAMPLE
    .\scripts\release.cmd minor

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\release.ps1 patch -Yes
#>
# -Bump si accetta anche come -patch / --patch.
param(
    [Parameter(Position = 0)]
    [ValidateSet('major', 'minor', 'patch')]
    [string]$Bump = '',
    [switch]$Patch,
    [switch]$Minor,
    [switch]$Major,
    [switch]$Yes,
    # --patch e simili non sono parametri PowerShell: arrivano qui.
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Rest
)

# 'Continue': git e npm scrivono su stderr anche messaggi normali. Gli errori veri si
# intercettano con l'exit code.
$ErrorActionPreference = 'Continue'

# Lo script sta in scripts\, il repository è la cartella sopra.
$root = Split-Path -Parent $PSScriptRoot
$packageFile = Join-Path $root 'package.json'
$lockFile = Join-Path $root 'package-lock.json'
$releaseBranch = 'main'
$devBranch = 'dev'
$appName = 'Xerioth'
$utf8 = New-Object System.Text.UTF8Encoding $false
$steps = 6
$width = 68
$clock = [System.Diagnostics.Stopwatch]::StartNew()

# ---- Output ---------------------------------------------------------------------

function Badge([string]$text, [ConsoleColor]$fg, [ConsoleColor]$bg) {
    Write-Host " $text " -ForegroundColor $fg -BackgroundColor $bg -NoNewline
}

function Line([string]$char, [ConsoleColor]$color) { Write-Host ($char * $width) -ForegroundColor $color }

function Step([int]$n, [string]$title) {
    Write-Host ''
    Badge "$n/$steps" Black Cyan
    Write-Host " $title" -ForegroundColor Cyan
    Line '─' DarkGray
}

function Ok([string]$msg) { Write-Host '  ' -NoNewline; Badge 'OK' Black Green; Write-Host " $msg" }
function Warn([string]$msg) { Write-Host '  ' -NoNewline; Badge '!!' Black Yellow; Write-Host " $msg" -ForegroundColor Yellow }
function Detail([string]$msg) { Write-Host "       $msg" -ForegroundColor DarkGray }

function Banner([string]$badge, [ConsoleColor]$fg, [ConsoleColor]$bg, [ConsoleColor]$color, [string]$title) {
    Write-Host ''
    Line '═' $color
    Write-Host '  ' -NoNewline
    Badge $badge $fg $bg
    Write-Host " $title" -ForegroundColor $color
    Line '═' $color
}

function Elapsed {
    $t = $clock.Elapsed
    if ($t.TotalMinutes -ge 1) { return '{0}m {1:00}s' -f [int][math]::Floor($t.TotalMinutes), $t.Seconds }
    return '{0}s' -f [int]$t.TotalSeconds
}

# La domanda resta a metà riga e Read-Host è senza testo: così funziona anche con l'input redirezionato.
function Ask([string]$question, [string]$choices) {
    Write-Host '  ' -NoNewline
    Badge '?' Black Magenta
    Write-Host " $question " -NoNewline -ForegroundColor White
    Write-Host "[$choices] " -NoNewline -ForegroundColor Yellow
    return ((Read-Host) -match '^(s|si|sì|y|yes)$')
}

function Show-Usage([string]$current) {
    Write-Host ''
    Write-Host '  Uso (da main, dopo il merge di dev)' -ForegroundColor White
    Write-Host '    .\scripts\release.cmd ' -NoNewline -ForegroundColor Gray
    Write-Host '<patch|minor|major>' -NoNewline -ForegroundColor Yellow
    Write-Host ' [-Yes]' -ForegroundColor DarkGray
    if ($current) {
        Write-Host ''
        Write-Host '  Versione attuale: ' -NoNewline -ForegroundColor White
        Write-Host $current -ForegroundColor Cyan
        $choices = @(
            @('patch', 'correzioni di bug'),
            @('minor', 'nuove funzionalità'),
            @('major', 'cambiamenti importanti')
        )
        foreach ($c in $choices) {
            Write-Host ('    {0,-7}' -f $c[0]) -NoNewline -ForegroundColor Yellow
            Write-Host ' -> ' -NoNewline -ForegroundColor DarkGray
            Write-Host ('{0,-9}' -f (Get-NextVersion $current $c[0])) -NoNewline -ForegroundColor Green
            Write-Host $c[1] -ForegroundColor DarkGray
        }
    }
    Write-Host ''
}

function Fail-Usage([string]$msg, [string]$current) {
    Banner 'ERRORE' White DarkRed Red $msg
    Show-Usage $current
    exit 1
}

# ---- Comandi ----------------------------------------------------------------------

function Get-NextVersion([string]$current, [string]$kind) {
    $v = [version]$current
    switch ($kind) {
        'major' { return "$($v.Major + 1).0.0" }
        'minor' { return "$($v.Major).$($v.Minor + 1).0" }
        'patch' { return "$($v.Major).$($v.Minor).$($v.Build + 1)" }
    }
}

# Comando lungo (test, build): l'output scorre a video.
function Invoke-Checked([string]$what, [scriptblock]$block) {
    & $block
    if ($LASTEXITCODE -ne 0) { throw "$what fallito (exit code $LASTEXITCODE)" }
}

# Comando breve (git, npm version): output attenuato e rientrato.
function Invoke-Quiet([string]$what, [scriptblock]$block) {
    $out = & $block 2>&1
    $code = $LASTEXITCODE
    foreach ($l in $out) { if ("$l".Trim()) { Detail "$l" } }
    if ($code -ne 0) { throw "$what fallito (exit code $code)" }
}

# Output di git letto come UTF-8: Windows PowerShell 5.1 userebbe la codepage OEM e
# l'emoji del messaggio di commit apparirebbe illeggibile (solo a video).
function Get-GitOutput([string[]]$gitArgs) {
    $prev = [Console]::OutputEncoding
    try {
        [Console]::OutputEncoding = $utf8
        return (& git @gitArgs)
    } finally {
        [Console]::OutputEncoding = $prev
    }
}

# "owner/repo" dall'indirizzo di origin (https o ssh).
function Get-RepoSlug {
    $url = git remote get-url origin 2>$null
    $m = [regex]::Match("$url", 'github\.com[:/](.+?)(\.git)?/?$')
    if ($m.Success) { return $m.Groups[1].Value }
    return ''
}

# Le note si scrivono solo qui: file temporaneo vuoto aperto nel Blocco note, letto
# quando si preme Invio ed eliminato subito dopo. Il testo resta solo in memoria.
function Read-ReleaseNotes {
    $file = Join-Path ([System.IO.Path]::GetTempPath()) ("Xerioth-note-{0}-{1}.txt" -f $Version, [guid]::NewGuid().ToString('N').Substring(0, 8))
    try {
        [System.IO.File]::WriteAllText($file, '', $utf8)
        Start-Process notepad.exe -ArgumentList "`"$file`""
        Write-Host '  ' -NoNewline
        Badge '?' Black Magenta
        Write-Host ' Scrivi le note di rilascio nel Blocco note (le leggono i giocatori),' -ForegroundColor White
        Write-Host '      salva e premi Invio qui per continuare ' -NoNewline -ForegroundColor White
        Read-Host | Out-Null
        return [System.IO.File]::ReadAllText($file).Trim()
    } finally {
        Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue
    }
}

# ---- Stato, per tornare indietro se qualcosa va storto -----------------------------

$versionWritten = $false
$committed = $false
$tagged = $false
$pushed = $false
$ghReady = $false
$notesText = ''

# Annulla quello che lo script ha fatto prima del commit; dopo il commit non tocca nulla.
function Undo-Local {
    if ($committed -or $pushed) { return }
    if ($versionWritten) {
        [System.IO.File]::WriteAllBytes($packageFile, $packageBytes)
        [System.IO.File]::WriteAllBytes($lockFile, $lockBytes)
        $script:versionWritten = $false
        Ok "Versione in package.json e package-lock.json ripristinata a $current"
    }
}

function Show-Recovery {
    $hints = @()
    if ($tagged) {
        $hints += "Il tag $tag esiste solo in locale. Riprova il push:  git push --atomic origin HEAD $tag"
        $hints += "oppure eliminalo:  git tag -d $tag"
    }
    if ($committed) {
        $hints += 'Il commit di release esiste solo in locale. Per annullarlo:  git reset --hard HEAD~1'
    }
    Write-Host ''
    if ($hints.Count -eq 0) {
        Write-Host "  Il repository è com'era prima della release." -ForegroundColor Gray
        return
    }
    Write-Host '  Da sistemare a mano' -ForegroundColor White
    foreach ($h in $hints) { Write-Host "    - $h" -ForegroundColor Yellow }
}

# ---- Argomenti --------------------------------------------------------------------

# Copia esatta dei file, per rimetterli com'erano se la release si interrompe.
$packageBytes = [System.IO.File]::ReadAllBytes($packageFile)
$lockBytes = [System.IO.File]::ReadAllBytes($lockFile)
$current = "$(([System.IO.File]::ReadAllText($packageFile, $utf8) | ConvertFrom-Json).version)"
if ($current -notmatch '^\d+\.\d+\.\d+$') {
    Banner 'ERRORE' White DarkRed Red 'version non trovata in package.json (X.Y.Z).'
    exit 1
}

$requested = @()
if ($Bump) { $requested += $Bump }
if ($Patch) { $requested += 'patch' }
if ($Minor) { $requested += 'minor' }
if ($Major) { $requested += 'major' }
if ($Rest) { $requested += $Rest }
$requested = @($requested | Where-Object { "$_".Trim() } | ForEach-Object { "$_".Trim() })
$validKinds = @('patch', 'minor', 'major')
$kinds = @($requested | ForEach-Object { $_.TrimStart('-').ToLower() } | Select-Object -Unique)
if ($kinds.Count -eq 0) { Fail-Usage 'Manca il tipo di release: indica patch, minor o major.' $current }
if ($kinds.Count -gt 1) { Fail-Usage ("Indica un solo tipo di release (ricevuti: {0})." -f ($requested -join ', ')) $current }
$kind = $kinds[0]
if ($kind -notin $validKinds) { Fail-Usage "Tipo di release non valido: '$($requested[0])'. Usa patch, minor o major." $current }

$Version = Get-NextVersion $current $kind
$tag = "v$Version"
$message = "chore(release): 🚀 release $Version"

# ---- Release --------------------------------------------------------------------

Push-Location $root
try {
    $repoSlug = Get-RepoSlug
    $repoUrl = "https://github.com/$repoSlug"
    $branch = (git symbolic-ref --short -q HEAD)
    if ($LASTEXITCODE -ne 0 -or -not $branch) { $branch = '' }

    Write-Host ''
    Line '═' Cyan
    Write-Host "  $appName" -NoNewline -ForegroundColor White
    Write-Host '  release ' -NoNewline -ForegroundColor DarkGray
    Write-Host $kind -ForegroundColor Yellow
    Write-Host '  ' -NoNewline
    Write-Host $current -NoNewline -ForegroundColor Gray
    Write-Host '  ->  ' -NoNewline -ForegroundColor DarkGray
    Write-Host $Version -NoNewline -ForegroundColor Green
    Write-Host "     tag $tag · $repoSlug" -ForegroundColor DarkGray
    Line '═' Cyan

    # ---- 1. Controlli -------------------------------------------------------------

    Step 1 'Controlli'
    if (-not $repoSlug) { throw 'origin non punta a un repository GitHub (git remote get-url origin).' }

    if ($branch -ne $releaseBranch) {
        throw "Le release partono da ${releaseBranch} (sei su '$branch'): git checkout $releaseBranch; git merge $devBranch"
    }
    Ok "Branch $releaseBranch"

    $dirty = @(git status --porcelain)
    if ($dirty.Count -gt 0) {
        foreach ($d in $dirty) { Detail $d }
        throw 'Ci sono modifiche non committate: le modifiche passano da dev, su main si fa solo il merge.'
    }
    Ok 'Working tree pulito'

    Detail 'Aggiornamento da origin...'
    git fetch --quiet origin 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Impossibile contattare origin: sei connesso a Internet?' }
    $behind = [int](git rev-list --count "HEAD..origin/$releaseBranch")
    if ($behind -gt 0) { throw "$releaseBranch è indietro di $behind commit rispetto a origin: git pull" }
    $ahead = [int](git rev-list --count "origin/$releaseBranch..HEAD")
    if ($ahead -gt 0) { Ok "$releaseBranch allineato a origin ($ahead commit locali da pubblicare con la release)" }
    else { Ok "$releaseBranch allineato a origin" }

    git rev-parse -q --verify "refs/remotes/origin/$devBranch" *> $null
    if ($LASTEXITCODE -eq 0) {
        $missing = @(Get-GitOutput @('log', '--oneline', "HEAD..origin/$devBranch"))
        if ($missing.Count -gt 0) {
            Warn "$($missing.Count) commit di origin/$devBranch non sono in ${releaseBranch}:"
            foreach ($l in $missing) { Detail $l }
            if ($Yes) { throw "Fai prima il merge di ${devBranch}: git merge origin/$devBranch" }
            if (-not (Ask "Pubblicare senza quei commit?" 's = continua / N = annulla')) {
                Banner 'ANNULLATO' Black Yellow Yellow "Nessuna modifica. Fai il merge: git merge origin/$devBranch"
                Write-Host ''
                exit 1
            }
        } else {
            Ok "$devBranch già unito a $releaseBranch"
        }
    }

    git rev-parse -q --verify "refs/tags/$tag" *> $null
    $localTag = $LASTEXITCODE -eq 0
    $remoteTag = git ls-remote --tags origin "refs/tags/$tag"
    if ($localTag -or $remoteTag) {
        throw "Il tag $tag esiste già (in locale o su origin). Se è di una release annullata eliminalo: git tag -d $tag; git push origin :refs/tags/$tag"
    }
    Ok "Tag $tag libero"

    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm non trovato: serve Node.js (https://nodejs.org).' }
    if (-not (Test-Path -LiteralPath (Join-Path $root 'node_modules'))) { throw 'Dipendenze mancanti: npm install' }
    Ok 'Node.js e dipendenze'

    if (Get-Command gh -ErrorAction SilentlyContinue) {
        gh auth status --hostname github.com *> $null
        $ghReady = $LASTEXITCODE -eq 0
        if (-not $ghReady) { Warn 'GitHub CLI non autenticata (gh auth login): la release su GitHub sarà da creare a mano' }
    } else {
        Warn 'GitHub CLI non trovata (winget install GitHub.cli): la release su GitHub sarà da creare a mano'
    }
    if ($ghReady) {
        $notesText = Read-ReleaseNotes
        if (-not $notesText) { throw 'Note di rilascio vuote: scrivile nel Blocco note e salva prima di premere Invio.' }
        Ok ("Note di rilascio scritte ({0} righe)" -f @($notesText -split "`r?`n").Count)
    }

    # ---- 2. Versione --------------------------------------------------------------

    Step 2 'Versione'
    $versionWritten = $true
    # npm version aggiorna insieme package.json e package-lock.json; commit e tag li fa lo script.
    Invoke-Quiet 'npm version' { npm.cmd version $Version --no-git-tag-version }
    Ok "package.json  $current -> $Version"

    # ---- 3. Test e build ----------------------------------------------------------

    Step 3 'Test e build di produzione'
    Invoke-Checked 'npm test' { npm.cmd test }
    Invoke-Checked 'npm run build' { npm.cmd run build }
    Ok 'Test superati e build riuscita'

    # ---- 4. Commit, tag, push -----------------------------------------------------

    Step 4 'Commit, tag e push'
    Write-Host '  Messaggio      ' -NoNewline -ForegroundColor White
    Write-Host $message -ForegroundColor Green
    Write-Host '  Tag            ' -NoNewline -ForegroundColor White
    Write-Host $tag -ForegroundColor Green
    Write-Host '  Push su        ' -NoNewline -ForegroundColor White
    Write-Host "origin/$releaseBranch (Cloudflare Pages pubblica il sito)" -ForegroundColor Green
    Write-Host '  Release GitHub ' -NoNewline -ForegroundColor White
    if ($ghReady) { Write-Host "$appName $Version su $repoSlug" -ForegroundColor Green }
    else { Write-Host 'da creare a mano nel browser' -ForegroundColor Yellow }

    if (-not $Yes) {
        Write-Host ''
        $what = if ($ghReady) { 'commit, tag, push e release su GitHub' } else { 'commit, tag e push' }
        if (-not (Ask "Procedere con ${what}?" 's/N')) {
            Banner 'ANNULLATO' Black Yellow Yellow 'Nessun commit, tag o push è stato fatto.'
            Undo-Local
            Show-Recovery
            Write-Host ''
            exit 1
        }
        Write-Host ''
    }

    Invoke-Quiet 'git add' { git -c core.safecrlf=false add package.json package-lock.json }
    # Il messaggio passa da un file UTF-8: così l'emoji arriva intatta a git anche da PowerShell 5.1.
    $msgFile = [System.IO.Path]::GetTempFileName()
    try {
        [System.IO.File]::WriteAllText($msgFile, $message, $utf8)
        Invoke-Quiet 'git commit' { git commit -q -F $msgFile }
    } finally {
        Remove-Item $msgFile -ErrorAction SilentlyContinue
    }
    $committed = $true
    Ok ("Commit {0}" -f (Get-GitOutput @('log', '--oneline', '-1')))

    Invoke-Quiet 'git tag' { git tag -a $tag -m "$appName $Version" }
    $tagged = $true
    Ok "Tag $tag"

    Detail "Push su origin ($releaseBranch + $tag)..."
    Invoke-Quiet 'git push' { git push --atomic origin HEAD $tag }
    $pushed = $true
    $tagged = $false
    $committed = $false
    Ok "Push di $releaseBranch e $tag su origin"

    # ---- 5. Release su GitHub -----------------------------------------------------

    Step 5 'Release su GitHub'
    $published = $false
    if ($ghReady) {
        # Le note passano da un file: come argomento PowerShell 5.1 rovinerebbe virgolette e a capo.
        $ghNotes = [System.IO.Path]::GetTempFileName()
        try {
            [System.IO.File]::WriteAllText($ghNotes, $notesText, $utf8)
            gh release create $tag --repo $repoSlug --title "$appName $Version" --notes-file $ghNotes --verify-tag
            $ghCode = $LASTEXITCODE
        } finally {
            Remove-Item -LiteralPath $ghNotes -Force -ErrorAction SilentlyContinue
        }
        if ($ghCode -eq 0) {
            $published = $true
            Ok "Release pubblicata: $repoUrl/releases/tag/$tag"
        } else {
            Warn "gh release create fallito (exit code $ghCode)"
            Detail "Creala a mano da $repoUrl/releases/new?tag=$tag"
            Detail 'con queste note (copiale da qui, non sono salvate altrove):'
            Write-Host ''
            foreach ($l in ($notesText -split "`r?`n")) { Write-Host "    $l" -ForegroundColor Cyan }
        }
    } else {
        $releaseUrl = "$repoUrl/releases/new?tag=$tag&title=$appName%20$Version"
        Write-Host '  Nella pagina aperta nel browser:' -ForegroundColor White
        Write-Host '    1. scrivi le novità per i giocatori nella descrizione' -ForegroundColor Gray
        Write-Host '    2. premi "Publish release"' -ForegroundColor Gray
        Start-Process $releaseUrl
    }

    # ---- 6. dev -------------------------------------------------------------------

    Step 6 "Allineamento di $devBranch"
    # Dopo il merge di dev, main ha in più solo il commit di release: dev avanza fino a lì, così
    # chi lavora su dev ha già la nuova versione.
    git rev-parse -q --verify "refs/remotes/origin/$devBranch" *> $null
    if ($LASTEXITCODE -eq 0) {
        git merge-base --is-ancestor "origin/$devBranch" HEAD
        if ($LASTEXITCODE -eq 0) {
            git push --quiet origin "HEAD:refs/heads/$devBranch" 2>$null
            if ($LASTEXITCODE -eq 0) { Ok "origin/$devBranch portato alla release" }
            else { Warn "Push di $devBranch fallito: git push origin ${releaseBranch}:$devBranch" }
        } else {
            Warn "origin/$devBranch ha commit nuovi: unisci la release a mano (git checkout $devBranch; git merge $releaseBranch)"
        }
    }
    git rev-parse -q --verify "refs/heads/$devBranch" *> $null
    if ($LASTEXITCODE -eq 0) {
        git merge-base --is-ancestor $devBranch HEAD
        if ($LASTEXITCODE -eq 0) {
            git branch -f $devBranch HEAD
            Ok "$devBranch locale portato alla release"
        } else {
            Warn "$devBranch locale ha commit non in ${releaseBranch}: git checkout $devBranch; git merge $releaseBranch"
        }
    }

    if ($published) {
        Banner 'FATTO' Black Green Green "$appName $Version pubblicata  ($(Elapsed))"
    } else {
        Banner 'FATTO' Black Green Green "${appName} ${Version}: tag $tag su origin  ($(Elapsed))"
        Write-Host '  Manca solo pubblicare la release su GitHub con le note.' -ForegroundColor Gray
    }
    Write-Host ''
} catch {
    Banner 'ERRORE' White DarkRed Red "Release interrotta: $($_.Exception.Message)"
    Undo-Local
    Show-Recovery
    Write-Host ''
    exit 1
} finally {
    Pop-Location
}
