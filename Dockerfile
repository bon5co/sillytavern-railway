# SillyTavern for Railway — pinned to the upstream Railway image and hardened so
# the default admin account cannot be claimed by the first stranger to open the
# public URL.
#
# Pinned by digest (SillyTavern 1.18.0) so a redeploy is never a surprise
# upstream upgrade — the frontend recompiles from this exact build every boot.
FROM ghcr.io/null2264/st-railway@sha256:e2aaefd1581f2555f87458204a0b43871a03f66d14fde6c885c59924977f6111

# Runs as root in the upstream image; Railway mounts the volume uid 0, so there
# is no volume-ownership repair to do here.
USER root

COPY seed-admin.cjs /home/node/app/seed-admin.cjs
COPY railway-entrypoint.sh /home/node/app/railway-entrypoint.sh
RUN chmod +x /home/node/app/railway-entrypoint.sh

ENTRYPOINT ["./railway-entrypoint.sh"]
