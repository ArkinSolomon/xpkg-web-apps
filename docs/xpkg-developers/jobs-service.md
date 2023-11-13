# Jobs Service

The X-Pkg jobs service is a centeral controller to handle jobs that have failed. It manages all jobs, and is a safety measure to prevent user packages to be stuck on processing forever, and handles unexpected disconnects by consider a job to be failed. All jobs run by worker threads are required to register with it.

## Authorization & Socket Event Flow

There is a specific dual-password handshake required before either the worker trusts the jobs service, or the jobs service trusts the worker. The password that the worker needs to send to the jobs service (`JOBS_SERVICE_PASSWORD`), as well as the sha256 hash of the password that the service sends to the worker (known as the server trust key, `SERVER_TRUST_HASH`), are placed into the environment of the worker thread (the registry). Likewise, the hash of the password that the worker sends to the jobs service (`JOBS_SERVICE_HASH`) and the server trust key (`SERVER_TRUST_KEY`) are placed into the environment of the service.

On a connection to the service, the service emits a `handshake` event to the worker, with the server trust key. The worker then compares this key to the hash, and if they match, it sends back another `handshake` event, with the jobs service password. The service checks to make sure the recieved password matches the stored hash, then sends back the `authorized`. Once the worker recieves the event, it sends the `job_data` event, with the data of it's current job, as a `JobData` object. The specifications for this object can be found on the jobs service at `/src/index.ts` as well as on the registry at `/src/workers/jobsServiceManager.ts`. Once the service recieves the job information, it attempts to insert it into the database (or claim it, see below) and then responds with a `job_data_recieived` event. The worker should only start processing after this event has been recieved from the service.

Once the worker has finished processing, it should emit a `done` event. The server will mark the job as completed, and then emit a `goodbye` event. The worker is safe to disconnect after this. Unexpected disconnections will result in the job being marked as failed. Any unauthorized requests, or requests out of order will result in a disconnection. Also, any clients that have not been authorized or have not sent their data within 30 seconds will be disconnected.

## Claiming Jobs

In the event of a crash of the jobs service, the service will pull all unfinished jobs from the database. When the worker sends their `job_data` event, the servicce will automatically attempts to reclaim the job. Any unclaimed job after sixty seconds after the service restarts will be failed.

## Handling Incorrect Failures

The worker is always trusted above the jobs server. Any incorrect failures should be overridden by the worker. There is obviously ways around everything, but the measures in place by the jobs service and the worker threads should greatly reduce the chance of a job being incorrectly marked as failed.

## Aborting Jobs

Any jobs that are not completed within three hours will be sent an abort signal from the jobs service via a `abort` event. The worker must abort the job immediately after recieving it. If the jobs service does not recieve an an `aborting` event within five seconds, the job will be failed by the service. Jobs are only checked for their durations every hour, ninety seconds after the service starts. The ninety-second delay exists in order to allow jobs to be claimed in case the service is down for an exceptionally long period of time.