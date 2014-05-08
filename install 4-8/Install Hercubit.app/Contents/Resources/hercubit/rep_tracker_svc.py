# Attribution: https://gist.github.com/schlady/1576079
# import numpy as np
import settings
import time
import pickle

import os

try:
    model=pickle.load(open('svc_model.p'))
except:
    model=pickle.load(open('/venv/lib/python2.7/site-packages/hercubit/svc_model.p'))


def peakdetect(y_axis, x_axis = None, lookahead = 500, delta = 0):
    """
    Converted from/based on a MATLAB script at http://billauer.co.il/peakdet.html
    
    Algorithm for detecting local maximas and minmias in a signal.
    Discovers peaks by searching for values which are surrounded by lower
    or larger values for maximas and minimas respectively
    
    keyword arguments:
    y_axis -- A list containg the signal over which to find peaks
    x_axis -- A x-axis whose values correspond to the 'y_axis' list and is used
        in the return to specify the postion of the peaks. If omitted the index
        of the y_axis is used. (default: None)
    lookahead -- (optional) distance to look ahead from a peak candidate to
        determine if it is the actual peak (default: 500) 
        '(sample / period) / f' where '4 >= f >= 1.25' might be a good value
    delta -- (optional) this specifies a minimum difference between a peak and
        the following points, before a peak may be considered a peak. Useful
        to hinder the algorithm from picking up false peaks towards to end of
        the signal. To work well delta should be set to 'delta >= RMSnoise * 5'.
        (default: 0)
            Delta function causes a 20% decrease in speed, when omitted
            Correctly used it can double the speed of the algorithm
    
    return -- two lists [maxtab, mintab] containing the positive and negative
        peaks respectively. Each cell of the lists contains a tupple of:
        (position, peak_value) 
        to get the average peak value do 'np.mean(maxtab, 0)[1]' on the results
    """
    maxtab = []
    mintab = []
    dump = []   #Used to pop the first hit which always if false
       
    length = len(y_axis)
    if x_axis is None:
        x_axis = range(length)
    
    #perform some checks
    if length != len(x_axis):
        raise ValueError, "Input vectors y_axis and x_axis must have same length"
    if lookahead < 1:
        raise ValueError, "Lookahead must be above '1' in value"
    # if not (np.isscalar(delta) and delta >= 0):
    #     raise ValueError, "delta must be a positive number"
    
    #needs to be a numpy array
    # y_axis = np.asarray(y_axis)
    inf=10000000
    #maxima and minima candidates are temporarily stored in
    #mx and mn respectively
    mn, mx = inf, -inf
    
    #Only detect peak if there is 'lookahead' amount of points after it
    for index, (x, y) in enumerate(zip(x_axis[:-lookahead], y_axis[:-lookahead])):
        # if index==1: mn, mx = y,y
        if y > mx:
            mx = y
            mxpos = x
        if y < mn:
            mn = y
            mnpos = x
        
        ####look for max####
        if y < mx-delta and mx != inf:
            #Maxima peak candidate found
            #look ahead in signal to ensure that this is a peak and not jitter
            if max(y_axis[index:index+lookahead]) < mx:
                maxtab.append((mxpos, mx))
                dump.append(True)
                #set algorithm to only find minima now
                mx = inf
                mn = inf
        ## Morgan's addition
            
        
        ####look for min####
        if y > mn+delta and mn != -inf:
            #Minima peak candidate found 
            #look ahead in signal to ensure that this is a peak and not jitter
            if min(y_axis[index:index+lookahead]) > mn:
                mintab.append((mnpos, mn))
                dump.append(False)
                #set algorithm to only find maxima now
                mn = -inf
                mx = -inf
    
    
    #Remove the false hit on the first value of the y_axis
    try:
        if dump[0]:
            maxtab.pop(0)
            #print "pop max"
        else:
            mintab.pop(0)
            #print "pop min"
        del dump
    except IndexError:
        #no peaks were found, should the function return empty lists?
        pass
    
    return maxtab, mintab


def std(mylist):
    """Using custom standard deviation function because numpy
    is difficult to install on all user's machines"""

    ave=sum(mylist)/len(mylist)
    deviations= [abs(x - ave)**2 for x in mylist]
    # print deviations
    st_dev= (sum(deviations)/len(deviations))**.5
    return st_dev

###
# Function by Morgan Wallace
#
# accepts streamed data from hercubit
# returns features of peaks
###
deltas={'acc':.15,'gyro':2500,'magnet':15}
last_peaks={}
t=[]
x=[]
y=[]
z=[]
gyro_x=[]
gyro_y=[]
gyro_z=[]

magnet_x=[]
magnet_y=[]
magnet_z=[]
rep_count=0
 # changes- get rid of first 8 lines- move them to main()
def live_peaks(sample,debug=False,dataset='archive',lookahead=4,elim_first_value=True,get_features=False):
    global deltas, last_peaks,t,y,x,z,gyro_z,gyro_y,gyro_x,magnet_z,magnet_x,magnet_y,rep_count

    # print sample
    # #refresh
    # if len(t)>1:
    #     if t[-1]+(settings.sampleRate*2)<time.time():
    #         last_peaks={}
    #         t=[]
    #         x=[]
    #         y=[]
    #         z=[]

    if debug==True:
        # Graph peaks
        import matplotlib.pyplot as plt
        import pylab as pl

    #time - (although, it's considered the 'x' axis in the peak detection function
    t.append(sample['time'])
    
    #using just the accelerometer's x,y,z for peak detection
    x.append(sample['accel'][0])
    y.append(sample['accel'][1])
    z.append(sample['accel'][2])

    gyro_x.append(sample['gyro'][0])
    gyro_y.append(sample['gyro'][1])
    gyro_z.append(sample['gyro'][2])

    magnet_x.append(sample['magnet'][0])
    magnet_y.append(sample['magnet'][1])
    magnet_z.append(sample['magnet'][2])


    #Don't even look for peaks unless a min_rep_window worth of time has passed
    if len(t)<settings.min_rep_window/settings.sampleRate: return None
    
    x_peaks=peakdetect(x,t,lookahead=lookahead,delta=deltas['acc'])
    y_peaks=peakdetect(y,t,lookahead=lookahead,delta=deltas['acc'])
    z_peaks=peakdetect(z,t,lookahead=lookahead,delta=deltas['acc'])
    
    ###
    # Test for completion of repitition
    # ...Once all axes have min and max
    # peaks_soFar= sum([1 for i in x_peaks+y_peaks+z_peaks if i!=[]])
    # peaks_soFar= sum([1 for i in x_peaks+y_peaks+z_peaks if i!=[]])
    # peaks_soFar= sum([1 for i in x_peaks+y_peaks+z_peaks if i!=[]])
    # peaks_soFar= sum([1 for i in x_peaks+y_peaks+z_peaks if i!=[]])

    rep_data=[]
    for dimension in [x,y,z,gyro_x,gyro_y,gyro_z,magnet_x,magnet_y,magnet_z]:
        # Analyze values for column
        avg=sum(dimension)/len(dimension)
        sd=std(dimension)
        rng=max(dimension) - min(dimension)
        rep_data.append(avg)
        rep_data.append(sd)
        rep_data.append(rng)
    prediction=model.predict_proba(rep_data)[0]
    # print prediction
    
    exerciseType=None
    #once type is determined, find completed peak for dominant axis
    for i in range(len(prediction)): #0=bicep, 1=shoulder, 2= tricep
        if prediction[i] >.3334:
            # print i
            if i==2: #tricep - dominant axis is z
                z_peaks_sofar= sum([1 for i in z_peaks if i!=[]])
                if z_peaks_sofar<2:
                    return None
                else: exerciseType='tricep'
            elif i==0: #bicep - dominant axis is y
                y_peaks_sofar= sum([1 for i in y_peaks if i!=[]])
                if y_peaks_sofar<2:
                    return None
                else: exerciseType='bicep'
            elif i==1: #shoulder - dominant axis is y
                y_peaks_sofar= sum([1 for i in y_peaks if i!=[]])
                if y_peaks_sofar<2:
                    return None
                else: exerciseType='shoulder'



    if exerciseType==None: return None
    print prediction
    # print sds
    rep_count+=1
    print exerciseType+' reps: '+str(rep_count)
    if debug==True:
        # Graph peaks
        import matplotlib.pyplot as plt
        import pylab as pl
        fig, ax = plt.subplots()
        ax.plot(t, x,label='x')
        ax.plot(t, y,label='y')
        ax.plot(t, z,label='z')
        plt.show()
        # ax.plot([q[0] for q in x_peaks[0]+x_peaks[1]],[q[1] for q in x_peaks[0]+x_peaks[1]],'o')
        # ax.plot([q[0] for q in y_peaks[0]+y_peaks[1]],[q[1] for q in y_peaks[0]+y_peaks[1]],'o')
        # ax.plot([q[0] for q in z_peaks[0]+z_peaks[1]],[q[1] for q in z_peaks[0]+z_peaks[1]],'o')
        # ax.legend()
    #find axis with 

    next_start_time= max([i[0][0] for i in x_peaks+y_peaks+z_peaks if i!=[]])
    for c in t:
#                         print c
        if round(c,2)==round(next_start_time,2):
            end=c
            i=t.index(c)
            break
    t=t[i:]
    x=x[i:]
    y=y[i:]
    z=z[i:]
    gyro_x=x[i:]
    gyro_y=y[i:]
    gyro_z=z[i:]
    magnet_x=x[i:]
    magnet_y=y[i:]
    magnet_z=z[i:]




def main():
    import device
    ser,conn_type=device.connect(bluetooth_enabled=True)
    gen = device.sensor_stream(ser,conn_type)
    while True:
        sample=gen.next()
        # print sample
        count=live_peaks(sample,debug=False)
        # if count!=None:
        #     # print count

if __name__ == '__main__':
    main()
 