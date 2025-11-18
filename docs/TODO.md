# TODO List for API Gateway Port Fix and Docker Cleanup

## Tasks
- [x] Edit `services/gateway/src/main.ts` to remove production server reference to port 3000, keeping only development on 3008.
- [x] Edit `docker-compose.yml` to update client API URLs from `http://gateway:3000` to `http://gateway:3008`.
- [x] Edit `start.sh` to add Docker stop and clean commands before building and starting services.
- [x] Verify no port 3000 references in gateway code.
- [x] Test the updated start script to ensure proper stop, clean, build, and start sequence.
