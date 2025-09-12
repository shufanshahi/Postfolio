# Job Candidate Expiry Scheduler Documentation

## Overview
The Job Candidate Expiry Scheduler is an automated system that manages the lifecycle of job candidates by:
1. Expiring PROCESSING candidates when their expire_date has passed
2. Automatically promoting ON candidates with the highest scores to fill the expired slots

## Components

### 1. JobCandidateSchedulerService
**Location**: `com.example.postfolio.jobcandidates.service.JobCandidateSchedulerService`

**Key Features**:
- Runs daily at midnight (00:00:00) using `@Scheduled(cron = "0 0 0 * * ?")`
- Transactional processing ensures data consistency
- Comprehensive logging for monitoring and debugging
- Error handling to prevent scheduler crashes

**Main Method**: `processExpiredCandidatesAndPromoteNew()`

### 2. Enhanced JobCandidateRepository
**Location**: `com.example.postfolio.jobcandidates.repository.JobCandidateRepository`

**New Methods**:
- `findByStatusAndExpireDateBefore()`: Finds expired PROCESSING candidates
- `findByJobIdAndStatusOrderByScoreDesc()`: Gets ON candidates ordered by highest score

### 3. Manual Trigger Endpoint
**Location**: `com.example.postfolio.jobcandidates.controller.JobCandidateController`

**Endpoint**: `POST /api/job-candidates/admin/trigger-expiry-process`
- Allows manual triggering for testing purposes
- Returns success/error messages

## Workflow

### Step 1: Find Expired Candidates
```sql
SELECT * FROM job_candidates 
WHERE status = 'PROCESSING' 
AND expire_date < CURRENT_DATE
```

### Step 2: Group by Job ID
Organizes expired candidates by their associated job to process each job separately.

### Step 3: Set Expired Candidates to OFF
For each expired candidate:
- Status: `PROCESSING` → `OFF`
- ExpireDate: `<date>` → `null`
- Save to database

### Step 4: Find Replacement Candidates
For each job with expired candidates:
```sql
SELECT * FROM job_candidates 
WHERE job_id = ? 
AND status = 'ON' 
ORDER BY score DESC
```

### Step 5: Promote Best Candidates
For each replacement candidate:
- Status: `ON` → `PROCESSING`
- ExpireDate: `null` → `CURRENT_DATE + job.expiryInterval`
- Number promoted = Number expired (1:1 replacement)

### Step 6: Handle No Available Candidates
If no ON candidates are available for promotion:
- Job's AutoSelectStatus: `ONGOING` → `COMPLETED`
- Logs warning about completed selection process

## Configuration

### Database Fields Required
**JobCandidate Entity**:
- `expireDate` (LocalDate): When the PROCESSING status expires
- `status` (CandidateStatus): Current candidate status
- `score` (Double): Candidate's score for ranking
- `jobId` (Long): Associated job reference

**Job Entity**:
- `expiryInterval` (Long): Days after which PROCESSING candidates expire
- `autoSelectStatus` (AutoSelectStatus): Current auto-selection status

### AutoSelectStatus Enum
- `OFF`: Auto-selection is disabled
- `ONGOING`: Auto-selection is active
- `COMPLETED`: Auto-selection finished (no more ON candidates available)

### CandidateStatus Enum
- `OFF`: Inactive candidate
- `ON`: Active candidate available for selection
- `PROCESSING`: Currently selected candidate with expiry date
- `ACCEPTED`: Candidate accepted the job offer
- `REJECTED`: Candidate rejected or was rejected

## Example Scenario

### Initial State
```
Job ID: 100, ExpiryInterval: 7 days

Candidates:
- Candidate A: PROCESSING, Score: 85, ExpireDate: 2025-09-12 (EXPIRED)
- Candidate B: PROCESSING, Score: 80, ExpireDate: 2025-09-12 (EXPIRED)  
- Candidate C: ON, Score: 90, ExpireDate: null
- Candidate D: ON, Score: 88, ExpireDate: null
- Candidate E: ON, Score: 82, ExpireDate: null
```

### After Scheduler Runs (2025-09-13)
```
Candidates:
- Candidate A: OFF, Score: 85, ExpireDate: null (EXPIRED → OFF)
- Candidate B: OFF, Score: 80, ExpireDate: null (EXPIRED → OFF)
- Candidate C: PROCESSING, Score: 90, ExpireDate: 2025-09-20 (ON → PROCESSING)
- Candidate D: PROCESSING, Score: 88, ExpireDate: 2025-09-20 (ON → PROCESSING)
- Candidate E: ON, Score: 82, ExpireDate: null (REMAINS ON)

Job AutoSelectStatus: ONGOING (still has ON candidates available)
```

### Scenario 2: No Available Candidates

### Initial State
```
Job ID: 200, ExpiryInterval: 5 days, AutoSelectStatus: ONGOING

Candidates:
- Candidate X: PROCESSING, Score: 90, ExpireDate: 2025-09-12 (EXPIRED)
- Candidate Y: PROCESSING, Score: 85, ExpireDate: 2025-09-12 (EXPIRED)
- No ON candidates available
```

### After Scheduler Runs (2025-09-13)
```
Candidates:
- Candidate X: OFF, Score: 90, ExpireDate: null (EXPIRED → OFF)
- Candidate Y: OFF, Score: 85, ExpireDate: null (EXPIRED → OFF)

Job AutoSelectStatus: COMPLETED (no ON candidates available for promotion)
```

## Logging

The scheduler provides detailed logging:
- Start/end of processing
- Individual candidate status changes
- Job-specific processing results
- Warning messages for insufficient candidates
- Error handling for edge cases

### Sample Log Output
```
INFO: Starting daily candidate expiry check and promotion at 2025-09-13
INFO: Candidate ID 1 for Job ID 100 has been set to OFF due to expiration. Expire date was: 2025-09-12
INFO: Candidate ID 3 (Score: 90.0) for Job ID 100 has been promoted to PROCESSING. New expire date: 2025-09-20
INFO: No ON candidates available for promotion for Job ID 200. Setting AutoSelectStatus to COMPLETED
INFO: Job ID 200 AutoSelectStatus has been set to COMPLETED due to no available ON candidates
INFO: Candidate expiry processing completed. Expired: 3, Promoted: 1
```

## Testing

### Unit Tests
**Location**: `JobCandidateSchedulerServiceTest`

**Test Coverage**:
- ✅ Normal expiry and promotion flow
- ✅ No expired candidates scenario
- ✅ No available candidates for promotion (sets AutoSelectStatus to COMPLETED)
- ✅ Job not found error handling
- ✅ Multiple jobs processing
- ✅ Manual trigger functionality
- ✅ AutoSelectStatus completion when no ON candidates available

### Manual Testing
Use the endpoint: `POST /api/job-candidates/admin/trigger-expiry-process`

## Performance Considerations

1. **Efficient Queries**: Uses indexed fields for fast lookups
2. **Batch Processing**: Groups by job ID to minimize database calls
3. **Transactional**: Ensures atomicity of the entire process
4. **Error Isolation**: Exceptions don't stop the scheduler from running

## Monitoring

Monitor the scheduler through:
1. **Application Logs**: Check for daily execution logs
2. **Database Metrics**: Monitor candidate status changes
3. **Manual Endpoint**: Test functionality manually if needed

## Dependencies

- Spring Boot Scheduler (`@EnableScheduling`)
- Spring Data JPA (Repository methods)
- Spring Transactions (`@Transactional`)
- SLF4J Logging (`@Slf4j`)

## Future Enhancements

1. **Configurable Schedule**: Make cron expression configurable
2. **Notification System**: Alert when candidates expire or get promoted
3. **Audit Trail**: Track all status changes with timestamps
4. **Dashboard**: Visual representation of candidate lifecycle
5. **Batch Optimization**: Process multiple jobs in parallel for large datasets