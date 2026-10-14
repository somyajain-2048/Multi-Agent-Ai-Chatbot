import proxy from "express-http-proxy";

//send userID in headers 

export const proxyWithHeaders = (serviceUrl) => {
    return (req, res, next) => {
        const isMultipart = Boolean(req.headers["content-type"]?.includes("multipart/form-data"));
        const p = proxy(serviceUrl, {
            parseReqBody: !isMultipart,
            proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
                if (srcReq.user) {
                    proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
                }
                return proxyReqOpts;
            },
            proxyReqBodyDecorator: (bodyContent, srcReq) => {
                if (isMultipart) {
                    return bodyContent;
                }
                if (srcReq.body && typeof srcReq.body === "object" && Object.keys(srcReq.body).length > 0) {
                    return JSON.stringify(srcReq.body);
                }
                return bodyContent;
            }
        });
        return p(req, res, next);
    };
};