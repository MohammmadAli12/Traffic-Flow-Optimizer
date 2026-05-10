import { useState, useEffect } from "react";
import {
  useListHospitals,
  getListHospitalsQueryKey,
  useCreateHospital,
  useDeleteHospital,
  useListIntersections,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Hospital as HospitalIcon, Plus, Trash2, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Hospitals() {
  const queryClient = useQueryClient();
  const { data: hospitalsData, isLoading: loadingHospitals } = useListHospitals();
  const hospitals = Array.isArray(hospitalsData)
    ? hospitalsData
    : hospitalsData?.data || [];

  const { data: intersectionsData } = useListIntersections();
  const intersections = Array.isArray(intersectionsData)
    ? intersectionsData
    : intersectionsData?.data || [];
  const createHospital = useCreateHospital();
  const deleteHospital = useDeleteHospital();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newIntersectionId, setNewIntersectionId] = useState("");
  const [showVideo, setShowVideo] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowVideo(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = () => {
    if (!newName || !newLocation || !newIntersectionId) return;
    createHospital.mutate(
      {
        data: {
          name: newName,
          location: newLocation,
          nearestIntersectionId: parseInt(newIntersectionId, 10),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHospitalsQueryKey() });
          setIsCreateOpen(false);
          setNewName("");
          setNewLocation("");
          setNewIntersectionId("");
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteHospital.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHospitalsQueryKey() });
        },
      }
    );
  };

  return (
    <div className="relative">
      {/* 5-Second Video Overlay */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-blue-900 overflow-hidden"
          >
            {/* Animated Gradient Background */}
            <motion.div
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: "linear-gradient(45deg, #ff0000, #0000ff, #ff0000)",
                backgroundSize: "200% 200%",
              }}
            />

            {/* Video Background */}
            <video
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              onEnded={() => setShowVideo(false)}
            >
              <source
                src="https://videos.pexels.com/video-files/3571937/3571937-sd_640_360_30fps.mp4"
                type="video/mp4"
              />
            </video>

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="relative z-10 text-center text-white">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mb-6"
              >
                <div className="text-7xl font-black">🚑</div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-black uppercase tracking-tighter mb-3"
              >
                Emergency Network
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-gray-300 font-mono"
              >
                Initializing Hospital Dashboard...
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-6 flex justify-center gap-2"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">Hospitals</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage emergency destinations</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 uppercase tracking-wide text-xs font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Register Hospital
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="uppercase tracking-tight">Register Hospital</DialogTitle>
                <DialogDescription>
                  Add a new medical facility to the routing network.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="uppercase text-xs font-bold text-muted-foreground">Facility Name</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. City General"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="uppercase text-xs font-bold text-muted-foreground">Location</Label>
                  <Input
                    id="location"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Med District Sector 2"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-xs font-bold text-muted-foreground">Nearest Node</Label>
                  <Select value={newIntersectionId} onValueChange={setNewIntersectionId}>
                    <SelectTrigger className="font-mono text-sm border-input">
                      <SelectValue placeholder="Select intersection" />
                    </SelectTrigger>
                    <SelectContent>
                      {intersections?.map((intersection) => (
                        <SelectItem key={intersection.id} value={intersection.id.toString()}>
                          {intersection.name}
                        </SelectItem>
                      ))}
                      {intersections?.length === 0 && (
                        <div className="px-2 py-4 text-sm text-muted-foreground">No intersections available.</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="uppercase text-xs font-bold">Cancel</Button>
                <Button onClick={handleCreate} disabled={!newName || !newLocation || !newIntersectionId || createHospital.isPending} className="uppercase text-xs font-bold">
                  {createHospital.isPending ? "Registering..." : "Register"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loadingHospitals ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {hospitals?.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-card/50"
                >
                  <HospitalIcon className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">No Hospitals Registered</h3>
                  <p className="text-sm text-muted-foreground max-w-sm text-center mt-1">
                    Ambulances need destinations. Register hospitals to enable emergency routing.
                  </p>
                </motion.div>
              ) : (
                Array.isArray(hospitals) && hospitals.map((hospital) => {
                  const nearestIntersection = intersections?.find((i) => i.id === hospital.nearestIntersectionId);
                  return (
                    <motion.div
                      key={hospital.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="bg-card border-card-border overflow-hidden group">
                        <CardHeader className="pb-3 bg-secondary/30 relative">
                          <div className="absolute top-2 right-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                              onClick={() => handleDelete(hospital.id)}
                              disabled={deleteHospital.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <HospitalIcon className="h-5 w-5 text-chart-1" />
                            {hospital.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 font-mono text-xs">
                            <MapPin className="h-3 w-3" /> {hospital.location}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
                          <div className="flex flex-col gap-1 border-t border-border pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Nearest Node</span>
                            <span className="font-mono">{nearestIntersection?.name || `Node #${hospital.nearestIntersectionId}`}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
