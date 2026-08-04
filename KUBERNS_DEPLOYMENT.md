# Project1 Kuberns Deployment

This repository is prepared for two Kuberns services:

1. Backend API service from `Video-master/` using `Video-master/Dockerfile`.
2. Frontend web service from the repository root using `Dockerfile`.

## Backend service

- Service type: Backend Service
- Repository: `Sharjeelsohail85/Project1`
- Branch: `main`
- Root directory: `Video-master`
- Dockerfile: `Video-master/Dockerfile`
- Port: `8080`
- Health check path: `/healthz`

Use `Video-master/.env.kuberns.example` as the environment-variable template. Add a MySQL database in Kuberns, copy the generated database variables into the backend service, then set `RUN_MIGRATIONS=true` for the first successful deployment.

## Frontend service

- Service type: Frontend or Web Service
- Repository: `Sharjeelsohail85/Project1`
- Branch: `main`
- Root directory: repository root
- Dockerfile: `Dockerfile`
- Port: `8080`
- Health check path: `/healthz`

After the backend service has a Kuberns free domain, set these frontend environment variables before deploying the frontend:

```env
VITE_PRODUCTION_API_ORIGIN=https://project1-backend-your-id.kuberns.com
VITE_API_BASE_URL=https://project1-backend-your-id.kuberns.com/api/v1
```

## Free Kuberns domains

Kuberns assigns a free `*.kuberns.com` domain when each service is deployed. Use the backend domain in the frontend environment variables, then redeploy the frontend so the React production bundle points at the live backend API.

## Plain Kubernetes fallback

If deploying to a regular Kubernetes cluster instead of Kuberns, build and push the two images referenced in `k8s/project1.yaml`, replace `project1.example.com` with your free DNS hostname, then apply the manifest.

